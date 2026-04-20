# Blog Automation

This site now reads blog content from `blog-posts.json`.

## What is already working

- `index.html` shows the latest posts automatically.
- `blog.html` shows the full blog archive automatically.
- `blog.js` reads from `blog-posts.json`.
- `scripts/generate-blog-post.mjs` can ask an LLM to create a new post and append it to the JSON file.

## Files you will use

- `blog-posts.json` for published posts
- `blog-topics.json` for the topic queue and writing rules
- `scripts/generate-blog-post.mjs` for AI post generation
- `scripts/netlify-build-blog.mjs` for Netlify build-time generation
- `scripts/run-daily-blog-post.ps1` for the Windows runner
- `scripts/install-daily-blog-task.ps1` to register a daily scheduled task
- `netlify/functions/trigger-daily-blog-build.mjs` for Netlify daily scheduling
- `netlify.toml` for Netlify build and functions config
- `.env.example` as the environment variable template

## Before you run the generator

1. Create a `.env` file in the project root with `OPENAI_API_KEY`.
2. Optional: create `OPENAI_MODEL` if you want a different model than the default.
3. Keep `blog-topics.json` focused on accessibility topics you actually want on the site.

Example `.env`:

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4.1-mini
```

## Run one new post manually

```powershell
$env:OPENAI_API_KEY="your_key_here"
node scripts/generate-blog-post.mjs
```

## What the script does

1. Reads your existing `blog-posts.json`
2. Picks the next unused topic from `blog-topics.json`
3. Requests a JSON blog post from the model
4. Adds the new post to the top of `blog-posts.json`

## Daily automation options

### Option 1: Windows Task Scheduler

Register the task once:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-daily-blog-task.ps1
```

By default, this creates a task named `WebAccessibilityDailyBlogPost` that runs every day at `09:00`.

To use a different time:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-daily-blog-task.ps1 -StartTime "14:30"
```

This is the best option if you keep the website files on your own computer and upload them yourself. The runner writes status output to `blog-automation.log`.

### Option 2: Netlify scheduled function or GitHub Actions

Use this if the site will live in a Git-based deployment flow later.

For Netlify:

1. Add `OPENAI_API_KEY` in Netlify environment variables.
2. Create a Netlify build hook and save the hook URL as `NETLIFY_BUILD_HOOK_URL`.
3. Deploy this project with `netlify.toml`.
4. Netlify will run `netlify/functions/trigger-daily-blog-build.mjs` every day at `03:30 UTC`.
5. That scheduled function triggers a build hook.
6. During that build, `scripts/netlify-build-blog.mjs` loads the current published `blog-posts.json`, appends one new post, and deploys the updated site.

Notes:

- `03:30 UTC` is `09:00` in India on April 20, 2026.
- Netlify scheduled functions run on published deploys and use UTC.
- The scheduled function can be tested from the Netlify Functions UI with `Run now`.

## Important note

AI-written blog posts should still be reviewed occasionally. The automation is useful, but quality, originality, and factual accuracy still matter for SEO and trust.
