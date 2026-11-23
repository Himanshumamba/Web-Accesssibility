const checks = [
  {
    name: "keyboard",
    title: "Keyboard access",
    guidance: "If a link, button, menu, or form control cannot be reached or used without a mouse, review keyboard operation and provide a reliable keyboard interaction.",
    criteria: "WCAG 2.1.1 Keyboard"
  },
  {
    name: "focus",
    title: "Visible focus",
    guidance: "If it is hard to tell which control is focused, add a clear focus indicator and ensure it is not hidden behind sticky content.",
    criteria: "WCAG 2.4.7 Focus Visible; 2.4.11 Focus Not Obscured (Minimum)"
  },
  {
    name: "structure",
    title: "Headings and structure",
    guidance: "If sections are difficult to understand, use descriptive headings and meaningful page regions so people can navigate the content.",
    criteria: "WCAG 1.3.1 Info and Relationships; 2.4.6 Headings and Labels"
  },
  {
    name: "images",
    title: "Images and text alternatives",
    guidance: "Add a useful text alternative to informative images. Mark purely decorative images so assistive technology can skip them.",
    criteria: "WCAG 1.1.1 Non-text Content"
  },
  {
    name: "forms",
    title: "Forms and errors",
    guidance: "Give each field a programmatic label, identify required fields, and explain errors in text next to the relevant control.",
    criteria: "WCAG 1.3.1 Info and Relationships; 3.3.2 Labels or Instructions; 3.3.1 Error Identification"
  },
  {
    name: "links",
    title: "Links and buttons",
    guidance: "Use names that explain a link destination or button action. Avoid relying on surrounding text or visual styling alone.",
    criteria: "WCAG 2.4.4 Link Purpose (In Context); 4.1.2 Name, Role, Value"
  },
  {
    name: "zoom",
    title: "Zoom and small screens",
    guidance: "Check that text can be enlarged and content reflows without loss of information or functionality.",
    criteria: "WCAG 1.4.4 Resize Text; 1.4.10 Reflow"
  }
];

let lightnessBaseColor = null;

function addTextElement(parent, tagName, text, className) {
  const element = document.createElement(tagName);
  element.textContent = text;
  if (className) {
    element.className = className;
  }
  parent.append(element);
  return element;
}

function startManualReview(pageUrl) {
  try {
    if (pageUrl) {
      sessionStorage.setItem("accessibilityReviewUrl", pageUrl);
    } else {
      sessionStorage.removeItem("accessibilityReviewUrl");
    }
  } catch (error) {
    // The contact page remains available if session storage is disabled.
  }
  window.location.assign(new URL("contact.html", window.location.href).href);
}

function renderReviewPlan(form, results) {
  const selectedChecks = checks.map((check) => ({
    ...check,
    answer: form.querySelector(`input[name="${check.name}"]:checked`)?.value || "unanswered"
  }));
  const answeredChecks = selectedChecks.filter((check) => check.answer !== "unanswered");
  const pageUrl = form.elements.websiteUrl.value.trim();

  results.replaceChildren();
  results.hidden = false;

  if (answeredChecks.length === 0) {
    addTextElement(results, "h2", "Choose at least one answer");
    addTextElement(results, "p", "Select a response for one or more checks to build your review plan.");
    return;
  }

  const needsAttention = selectedChecks.filter((check) => check.answer === "no");
  const notChecked = selectedChecks.filter((check) => check.answer === "unsure");
  const markedWorking = selectedChecks.filter((check) => check.answer === "yes");

  addTextElement(results, "h2", "Your review plan");
  addTextElement(
    results,
    "p",
    `You answered ${answeredChecks.length} of ${checks.length} checks. Your answers are a self-report; this tool has not inspected your page.`
  );

  if (needsAttention.length === 0 && notChecked.length === 0) {
    addTextElement(results, "h3", "No issues reported in your answers");
    addTextElement(results, "p", "You marked each answered area as working. That is not a WCAG pass or conformance result; consider checking the page with assistive technology and a qualified reviewer.");
  }

  if (needsAttention.length > 0) {
    addTextElement(results, "h3", "Start with the issues you found");
    const issueList = document.createElement("ul");
    issueList.className = "tool-findings-list";
    needsAttention.forEach((check) => {
      const item = document.createElement("li");
      item.className = "tool-finding-card";
      addTextElement(item, "strong", check.title);
      addTextElement(item, "p", check.guidance);
      addTextElement(item, "p", check.criteria, "tool-criteria");
      issueList.append(item);
    });
    results.append(issueList);
  }

  if (notChecked.length > 0) {
    addTextElement(results, "h3", "Checks to try next");
    const unsureList = document.createElement("ul");
    unsureList.className = "tool-findings-list";
    notChecked.forEach((check) => {
      const item = document.createElement("li");
      item.className = "tool-finding-card";
      addTextElement(item, "strong", check.title);
      addTextElement(item, "p", check.guidance);
      addTextElement(item, "p", check.criteria, "tool-criteria");
      unsureList.append(item);
    });
    results.append(unsureList);
  }

  if (markedWorking.length > 0) {
    const details = document.createElement("details");
    addTextElement(details, "summary", `Areas you marked as working (${markedWorking.length})`);
    const markedList = document.createElement("ul");
    markedList.className = "tool-working-list";
    markedWorking.forEach((check) => addTextElement(markedList, "li", check.title));
    details.append(markedList);
    results.append(details);
  }

  addTextElement(results, "p", "This quick check covers selected common issues only. It does not scan your code, test every WCAG success criterion, or determine legal compliance.", "tool-disclosure");

  const reviewLink = document.createElement("a");
  reviewLink.className = "btn";
  reviewLink.href = "contact.html";
  reviewLink.textContent = "Request a Free Manual 3-Issue Review";
  reviewLink.addEventListener("click", (event) => {
    event.preventDefault();
    const pageUrlInput = form.elements.websiteUrl;
    if (pageUrl && !pageUrlInput.checkValidity()) {
      pageUrlInput.reportValidity();
      return;
    }
    startManualReview(pageUrl);
  });
  results.append(reviewLink);
}

function normalizeHex(value) {
  const trimmed = value.trim();
  if (!/^#?[0-9a-f]{6}$/i.test(trimmed)) {
    return null;
  }
  return trimmed.startsWith("#") ? trimmed.toUpperCase() : `#${trimmed.toUpperCase()}`;
}

function relativeLuminance(hexColor) {
  const hex = hexColor.slice(1);
  const channels = [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255);
  const linear = channels.map((channel) => channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4);
  return (0.2126 * linear[0]) + (0.7152 * linear[1]) + (0.0722 * linear[2]);
}

function hexToHsl(hexColor) {
  const hex = hexColor.slice(1);
  const [red, green, blue] = [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255);
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  const lightness = (max + min) / 2;
  let hue = 0;
  let saturation = 0;

  if (delta !== 0) {
    saturation = delta / (1 - Math.abs((2 * lightness) - 1));
    if (max === red) {
      hue = 60 * (((green - blue) / delta) % 6);
    } else if (max === green) {
      hue = 60 * (((blue - red) / delta) + 2);
    } else {
      hue = 60 * (((red - green) / delta) + 4);
    }
    if (hue < 0) hue += 360;
  }

  return { hue, saturation, lightness };
}

function hslToHex(hue, saturation, lightness) {
  const normalizedSaturation = saturation;
  const normalizedLightness = lightness / 100;
  const chroma = (1 - Math.abs((2 * normalizedLightness) - 1)) * normalizedSaturation;
  const hueSection = ((hue % 360) + 360) % 360 / 60;
  const secondary = chroma * (1 - Math.abs((hueSection % 2) - 1));
  const offset = normalizedLightness - (chroma / 2);
  let channels;

  if (hueSection < 1) channels = [chroma, secondary, 0];
  else if (hueSection < 2) channels = [secondary, chroma, 0];
  else if (hueSection < 3) channels = [0, chroma, secondary];
  else if (hueSection < 4) channels = [0, secondary, chroma];
  else if (hueSection < 5) channels = [secondary, 0, chroma];
  else channels = [chroma, 0, secondary];

  return `#${channels.map((channel) => Math.round((channel + offset) * 255).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

function updateContrast() {
  const foregroundInput = document.getElementById("foregroundHex");
  const backgroundInput = document.getElementById("backgroundHex");
  const foregroundPicker = document.getElementById("foregroundPicker");
  const backgroundPicker = document.getElementById("backgroundPicker");
  const preview = document.getElementById("contrastPreview");
  const result = document.getElementById("contrastResult");
  const lightnessSlider = document.getElementById("textLightness");
  const lightnessValue = document.getElementById("textLightnessValue");
  const copyButton = document.getElementById("copyTextColor");
  const foreground = normalizeHex(foregroundInput.value);
  const background = normalizeHex(backgroundInput.value);

  if (!foreground || !background) {
    result.replaceChildren();
    addTextElement(result, "p", "Enter a valid six-digit hex color for both text and background.");
    lightnessSlider.disabled = !foreground;
    copyButton.disabled = !foreground;
    return;
  }

  foregroundInput.value = foreground;
  backgroundInput.value = background;
  foregroundPicker.value = foreground;
  backgroundPicker.value = background;
  preview.style.setProperty("--preview-foreground", foreground);
  preview.style.setProperty("--preview-background", background);
  const foregroundHsl = hexToHsl(foreground);
  lightnessBaseColor = lightnessBaseColor || foregroundHsl;
  const lightnessPercent = Math.round(foregroundHsl.lightness * 100);
  lightnessSlider.value = lightnessPercent;
  lightnessSlider.disabled = false;
  lightnessValue.value = `${lightnessPercent}%`;
  lightnessValue.textContent = `${lightnessPercent}%`;
  copyButton.disabled = false;

  const luminances = [relativeLuminance(foreground), relativeLuminance(background)].sort((a, b) => b - a);
  const ratio = (luminances[0] + 0.05) / (luminances[1] + 0.05);
  const aaNormal = ratio >= 4.5;
  const aaLarge = ratio >= 3;
  const aaaNormal = ratio >= 7;
  const aaaLarge = ratio >= 4.5;

  result.replaceChildren();
  addTextElement(result, "strong", `Contrast ratio: ${ratio.toFixed(2)}:1`);
  const outcomes = document.createElement("div");
  outcomes.className = "contrast-outcomes";
  [
    { label: "WCAG AA - normal text", threshold: "4.5:1", passes: aaNormal },
    { label: "WCAG AA - large text", threshold: "3:1", passes: aaLarge },
    { label: "WCAG AAA - normal text", threshold: "7:1", passes: aaaNormal },
    { label: "WCAG AAA - large text", threshold: "4.5:1", passes: aaaLarge }
  ].forEach(({ label, threshold, passes }) => {
    const row = document.createElement("p");
    row.className = "contrast-outcome";
    addTextElement(row, "span", `${label} (${threshold})`);
    const badge = addTextElement(row, "strong", passes ? "Pass" : "Needs adjustment");
    badge.className = passes ? "contrast-pass" : "contrast-fail";
    outcomes.append(row);
  });
  result.append(outcomes);
}

document.addEventListener("DOMContentLoaded", () => {
  const selfCheckForm = document.getElementById("selfCheckForm");
  const checkResults = document.getElementById("checkResults");

  selfCheckForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    renderReviewPlan(selfCheckForm, checkResults);
  });

  selfCheckForm?.addEventListener("reset", () => {
    window.setTimeout(() => {
      checkResults.replaceChildren();
      checkResults.hidden = true;
    }, 0);
  });

  if (document.getElementById("foregroundHex")) {
    document.getElementById("foregroundHex").addEventListener("input", () => {
      const color = normalizeHex(document.getElementById("foregroundHex").value);
      lightnessBaseColor = color ? hexToHsl(color) : null;
      document.getElementById("copyTextColorStatus").textContent = "";
      updateContrast();
    });
    document.getElementById("backgroundHex")?.addEventListener("input", updateContrast);

    document.getElementById("foregroundPicker")?.addEventListener("input", (event) => {
      document.getElementById("foregroundHex").value = event.currentTarget.value.toUpperCase();
      lightnessBaseColor = hexToHsl(event.currentTarget.value.toUpperCase());
      document.getElementById("copyTextColorStatus").textContent = "";
      updateContrast();
    });

    document.getElementById("backgroundPicker")?.addEventListener("input", (event) => {
      document.getElementById("backgroundHex").value = event.currentTarget.value.toUpperCase();
      updateContrast();
    });

    const textLightness = document.getElementById("textLightness");
    const foregroundHex = document.getElementById("foregroundHex");
    textLightness?.addEventListener("input", (event) => {
      const color = normalizeHex(foregroundHex.value);
      if (!color) return;
      const baseColor = lightnessBaseColor || hexToHsl(color);
      foregroundHex.value = hslToHex(baseColor.hue, baseColor.saturation, Number(event.currentTarget.value));
      document.getElementById("copyTextColorStatus").textContent = "";
      updateContrast();
    });

    document.getElementById("copyTextColor")?.addEventListener("click", async () => {
      const color = normalizeHex(foregroundHex.value);
      const status = document.getElementById("copyTextColorStatus");
      if (!color) return;

      try {
        if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
        await navigator.clipboard.writeText(color);
        status.textContent = `${color} copied.`;
      } catch (error) {
        foregroundHex.focus();
        foregroundHex.select();
        status.textContent = `Color selected: ${color}. Copy the highlighted value.`;
      }
    });
    updateContrast();
  }

  const manualReviewLink = document.getElementById("manualReviewLink");
  const websiteUrl = document.getElementById("websiteUrl");
  manualReviewLink?.addEventListener("click", (event) => {
    event.preventDefault();
    const pageUrl = websiteUrl.value.trim();
    if (pageUrl && !websiteUrl.checkValidity()) {
      websiteUrl.reportValidity();
      return;
    }
    startManualReview(pageUrl);
  });

});
