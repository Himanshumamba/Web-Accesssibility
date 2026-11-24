import process from "node:process";

import { createNextDraft } from "./blog-generator.mjs";

async function main() {
  const { post, draftPath } = await createNextDraft();
  console.log(`Created draft: ${post.title}`);
  console.log(`Review it before publishing: ${draftPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
