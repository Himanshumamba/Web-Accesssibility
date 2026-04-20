import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

export const rootDir = path.resolve(process.cwd());
export const defaultPostsPath = path.join(rootDir, "blog-posts.json");
export const defaultConfigPath = path.join(rootDir, "blog-topics.json");

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function extractTextContent(responseJson) {
  const outputs = responseJson.output || [];

  for (const item of outputs) {
    if (!Array.isArray(item.content)) {
      continue;
    }

    for (const contentItem of item.content) {
      if (contentItem.type === "output_text" && contentItem.text) {
        return contentItem.text;
      }
      if (contentItem.type === "refusal" && contentItem.refusal) {
        throw new Error(`Model refused the request: ${contentItem.refusal}`);
      }
    }
  }

  throw new Error("No text output was returned by the model.");
}

export async function loadJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

export async function saveJson(filePath, data) {
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export async function fetchRemoteJson(url) {
  const response = await fetch(url, { headers: { "Cache-Control": "no-cache" } });
  if (!response.ok) {
    throw new Error(`Could not load remote JSON from ${url}: ${response.status}`);
  }

  return response.json();
}

export async function generatePost({ topic, config, existingPosts }) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY. Add it to your environment before running the script.");
  }

  const recentTitles = existingPosts.slice(0, 8).map((post) => `- ${post.title}`).join("\n");
  const instructions = [
    "Return only valid JSON.",
    "Write a short, original blog post for a website accessibility consultant.",
    "Target US-facing businesses, agencies, and site owners.",
    "Keep the tone practical and trustworthy, not hype-heavy.",
    "Avoid repeating recent titles or angles.",
    "Do not mention AI, automation, or that the article was generated."
  ].join(" ");

  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["title", "excerpt", "readTime", "tags", "body"],
    properties: {
      title: { type: "string" },
      excerpt: { type: "string" },
      readTime: { type: "string" },
      tags: {
        type: "array",
        items: { type: "string" }
      },
      body: {
        type: "array",
        items: { type: "string" }
      }
    }
  };

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: [
                `Website: ${config.siteName}`,
                `Author: ${config.author}`,
                `Tone: ${config.tone}`,
                `Call to action: ${config.cta}`,
                `Topic for this post: ${topic}`,
                "Recent titles to avoid duplicating:",
                recentTitles || "- None yet",
                "Write a blog post as JSON with a concise title, one excerpt, a readTime like '4 min read', 2-4 tags, and 3-5 body paragraphs."
              ].join("\n")
            }
          ]
        }
      ],
      instructions,
      text: {
        format: {
          type: "json_schema",
          name: "blog_post",
          strict: true,
          schema
        }
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
  }

  const responseJson = await response.json();
  const parsed = JSON.parse(extractTextContent(responseJson));
  const date = todayIsoDate();
  const slug = slugify(parsed.title);

  return {
    id: `${slug}-${date}`,
    slug,
    date,
    title: parsed.title.trim(),
    excerpt: parsed.excerpt.trim(),
    readTime: parsed.readTime.trim(),
    tags: parsed.tags.map((tag) => tag.trim()).filter(Boolean).slice(0, 4),
    body: parsed.body.map((paragraph) => paragraph.trim()).filter(Boolean)
  };
}

export async function appendNextPost({ postsPath = defaultPostsPath, configPath = defaultConfigPath, initialPosts } = {}) {
  const posts = initialPosts || await loadJson(postsPath);
  const config = await loadJson(configPath);
  const usedTopics = new Set(posts.map((post) => post.sourceTopic).filter(Boolean));
  const nextTopic = config.topics.find((topic) => !usedTopics.has(topic)) || config.topics[0];

  const newPost = await generatePost({
    topic: nextTopic,
    config,
    existingPosts: posts
  });

  const withSourceTopic = { ...newPost, sourceTopic: nextTopic };
  const updatedPosts = [withSourceTopic, ...posts];
  await saveJson(postsPath, updatedPosts);

  return withSourceTopic;
}
