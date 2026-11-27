import dns from "node:dns/promises";
import net from "node:net";
import crypto from "node:crypto";
import { getStore } from "@netlify/blobs";
import chromium from "@sparticuz/chromium";
import { chromium as playwright } from "playwright-core";
import axe from "axe-core";

const MAX_SCAN_MS = 30_000;
const DAILY_SCAN_LIMIT = 3;
const memoryUsage = new Map();

function getClientIp(request, context) {
  return (
    context?.ip ||
    request.headers.get("x-nf-client-connection-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    "unknown"
  );
}

function getUtcDayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getClientKey(ip) {
  const secret = process.env.SCANNER_RATE_LIMIT_SECRET || "local-development-scanner-limit";
  return crypto.createHash("sha256").update(`${secret}:${ip}`).digest("hex").slice(0, 32);
}

async function checkDailyLimit(request, context) {
  const day = getUtcDayKey();
  const key = getClientKey(getClientIp(request, context));

  try {
    const store = getStore("accessibility-scanner");
    const record = await store.get(key, { type: "json" });
    const current = record?.day === day ? Number(record.count) || 0 : 0;

    if (current >= DAILY_SCAN_LIMIT) {
      return { allowed: false, remaining: 0 };
    }

    await store.setJSON(key, { day, count: current + 1 });
    return { allowed: true, remaining: DAILY_SCAN_LIMIT - current - 1 };
  } catch (error) {
    console.warn("Netlify Blobs unavailable; using process-local scanner limit.", error.message);

    const memoryKey = `${day}:${key}`;
    const current = memoryUsage.get(memoryKey) || 0;
    if (memoryUsage.size > 1000) memoryUsage.clear();

    if (current >= DAILY_SCAN_LIMIT) {
      return { allowed: false, remaining: 0 };
    }

    memoryUsage.set(memoryKey, current + 1);
    return { allowed: true, remaining: DAILY_SCAN_LIMIT - current - 1 };
  }
}

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}

function isPrivateAddress(address) {
  if (net.isIPv4(address)) {
    const [a, b, c] = address.split(".").map(Number);
    return (
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) ||
      a === 0 ||
      (a === 192 && b === 0 && c === 0)
    );
  }

  const normalized = address.toLowerCase();
  return (
    normalized === "::1" ||
    normalized === "::" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb")
  );
}

async function validatePublicUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Enter a complete URL, including https://.");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only HTTP and HTTPS websites can be scanned.");
  }
  if (parsed.username || parsed.password) {
    throw new Error("URLs containing login credentials are not supported.");
  }

  const addresses = await dns.lookup(parsed.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error("Local and private network addresses cannot be scanned.");
  }

  return parsed;
}

function wcagTags(tags) {
  return tags.filter((tag) => /^wcag\d/.test(tag)).map((tag) => tag.toUpperCase());
}

export default async (request, context) => {
  if (request.method !== "POST") {
    return jsonResponse(405, { error: "Use POST to start a scan." });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse(400, { error: "Invalid JSON request." });
  }

  let targetUrl;
  try {
    targetUrl = await validatePublicUrl(payload.url);
  } catch (error) {
    return jsonResponse(400, { error: error.message });
  }

  const limit = await checkDailyLimit(request, context);
  if (!limit.allowed) {
    return jsonResponse(429, {
      error: "You have used all three free scans for today. Please try again tomorrow or request a manual accessibility review.",
      retryAfter: "tomorrow"
    });
  }

  let browser;
  try {
    browser = await playwright.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true
    });

    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.setDefaultTimeout(MAX_SCAN_MS);

    const response = await page.goto(targetUrl.href, {
      waitUntil: "domcontentloaded",
      timeout: 20_000
    });
    if (!response || response.status() >= 400) {
      throw new Error(`The page returned HTTP ${response?.status() || "an unknown status"}.`);
    }

    await page.waitForTimeout(750);
    await page.addScriptTag({ content: axe.source });

    const results = await page.evaluate(async () => {
      return await window.axe.run(document, {
        resultTypes: ["violations", "incomplete", "passes"],
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"]
        }
      });
    });

    const violations = results.violations.slice(0, 25).map((item) => ({
      rule: item.id,
      impact: item.impact,
      title: item.help,
      description: item.description,
      wcag: wcagTags(item.tags),
      helpUrl: item.helpUrl,
      nodes: item.nodes.slice(0, 5).map((node) => ({
        target: node.target.join(" "),
        html: node.html.slice(0, 500),
        failureSummary: node.failureSummary
      }))
    }));

    const incomplete = results.incomplete.slice(0, 15).map((item) => ({
      rule: item.id,
      impact: item.impact,
      title: item.help,
      wcag: wcagTags(item.tags),
      helpUrl: item.helpUrl,
      nodeCount: item.nodes.length
    }));

    const title = await page.title();
    const finalUrl = page.url();

    return jsonResponse(200, {
      scannedUrl: targetUrl.href,
      finalUrl,
      title,
      timestamp: new Date().toISOString(),
      summary: {
        violations: violations.length,
        manualReviewItems: incomplete.length,
        passes: results.passes.length
      },
      violations,
      incomplete,
      disclaimer: "Automated checks can detect common issues, but they cannot determine WCAG conformance or legal compliance."
    });
  } catch (error) {
    console.error(error);
    const message = error.message?.includes("timeout")
      ? "The page took too long to load and could not be scanned."
      : "The page could not be scanned. It may block automated browsers or require login.";
    return jsonResponse(422, { error: message });
  } finally {
    if (browser) await browser.close();
  }
};
