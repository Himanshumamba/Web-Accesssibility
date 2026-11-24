# Blog publishing

Published articles live in `blog-posts.json`. The Netlify build creates one crawlable HTML page per article under `blog/`, fills the static archive in `blog.html`, and adds article URLs to `sitemap.xml`.

## Create a draft

Set `OPENAI_API_KEY`, then run:

```powershell
node scripts/generate-blog-post.mjs
```

The script saves a JSON file in `drafts/`. Review and edit the draft for accuracy, useful original examples, and client relevance before adding it to `blog-posts.json`. Generated drafts are not published automatically.

The GitHub Actions workflow is manual only and uploads the draft as a short-lived workflow artifact for review. Local drafts are git-ignored. Automatic scheduled publishing is disabled. The former Windows scheduled-task runner also does not generate or publish posts.

## Publish a reviewed post

Add the reviewed post to the top of `blog-posts.json`, then deploy the site. Netlify runs `scripts/netlify-build-blog.mjs` to generate its article page, update the archive, and update the sitemap.

Use distinct, useful article topics. Prefer original examples from accessibility reviews and practical fixes over short general summaries.
