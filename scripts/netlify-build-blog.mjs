import process from "node:process";

import {
  appendNextPost,
  defaultConfigPath,
  defaultPostsPath,
  fetchRemoteJson,
  loadJson,
  saveJson
} from "./blog-generator.mjs";

function trimTrailingSlash(value) {
  return value ? value.replace(/\/+$/, "") : "";
}

function getHookPayload() {
  const raw = process.env.INCOMING_HOOK_BODY;
  if (!raw) {
    return { raw: "" };
  }

  try {
    return JSON.parse(raw);
  } catch {
    return { raw };
  }
}

function shouldGenerateFromHook(hookPayload) {
  const hookUrl = process.env.INCOMING_HOOK_URL || "";
  const hookTitle = process.env.INCOMING_HOOK_TITLE || "";
  const rawBody = typeof hookPayload?.raw === "string" ? hookPayload.raw : "";

  if (hookPayload?.reason === "scheduled-blog-post") {
    return true;
  }

  if (rawBody.includes("scheduled-blog-post")) {
    return true;
  }

  return Boolean(hookUrl || hookTitle);
}

async function loadPublishedPosts(config) {
  const siteUrl = trimTrailingSlash(process.env.SITE_URL || process.env.URL || config.siteUrl);
  if (!siteUrl) {
    return null;
  }

  try {
    return await fetchRemoteJson(`${siteUrl}/blog-posts.json?ts=${Date.now()}`);
  } catch (error) {
    console.warn(`Could not load published blog-posts.json from ${siteUrl}: ${error.message}`);
    return null;
  }
}

async function main() {
  const config = await loadJson(defaultConfigPath);
  const publishedPosts = await loadPublishedPosts(config);
  const existingPosts = publishedPosts || await loadJson(defaultPostsPath);
  const hookPayload = getHookPayload();
  const shouldGeneratePost = shouldGenerateFromHook(hookPayload);

  await saveJson(defaultPostsPath, existingPosts);

  if (!shouldGeneratePost) {
    console.log("Skipping blog generation for this build.");
    return;
  }

  const newPost = await appendNextPost({
    initialPosts: existingPosts
  });

  console.log(`Created blog post for Netlify deploy: ${newPost.title}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
