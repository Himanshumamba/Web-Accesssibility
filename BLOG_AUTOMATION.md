# Blog publishing

Published articles live in `blog-posts.json`. The Netlify build creates one crawlable HTML page per article under `blog/`, fills the static archive in `blog.html`, and adds article URLs to `sitemap.xml`.

## Create a draft

Set `OPENAI_API_KEY`, then run:

```powershell
node scripts/generate-blog-post.mjs
```

The script saves a JSON file in `drafts/`. Review and edit the draft for accuracy, useful original examples, and client relevance before adding it to `blog-posts.json`. Generated drafts are not published automatically.

GitHub Actions generates and publishes one post on the 1st of each month at 12:00 UTC (5:30 PM India time). It adds the post to `blog-posts.json` and pushes the change; Netlify then builds the article page, archive, and sitemap. The workflow can also be started manually from GitHub Actions. It uses the `GEMINI_API_KEY` repository secret.

## Publish a reviewed post

Add the reviewed post to the top of `blog-posts.json`, then deploy the site. Netlify runs `scripts/netlify-build-blog.mjs` to generate its article page, update the archive, and update the sitemap.

Use distinct, useful article topics. Prefer original examples from accessibility reviews and practical fixes over short general summaries.
