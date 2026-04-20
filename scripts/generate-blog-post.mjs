import process from "node:process";

import { appendNextPost } from "./blog-generator.mjs";

async function main() {
  const newPost = await appendNextPost();
  console.log(`Created blog post: ${newPost.title}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
