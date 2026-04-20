# GitHub + Netlify Auto Blog Setup

This project is ready for automatic daily blog posting through GitHub and Netlify.

## 1. Put this project on GitHub

From this folder in PowerShell:

```powershell
git init
git add .
git commit -m "Initial site setup"
```

Then create an empty GitHub repository and connect it:

```powershell
git remote add origin YOUR_GITHUB_REPO_URL
git branch -M main
git push -u origin main
```

## 2. Connect GitHub to Netlify

In Netlify:

1. Choose `Add new site`
2. Choose `Import an existing project`
3. Select your GitHub repo
4. Keep the publish directory as `.`
5. Netlify should detect `netlify.toml` automatically

## 3. Add Netlify environment variables

In `Site configuration` -> `Environment variables`, add:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
  Example: `gpt-4.1-mini`
- `NETLIFY_BUILD_HOOK_URL`

## 4. Create the build hook

In Netlify:

1. Open `Site configuration`
2. Open `Build & deploy`
3. Open `Build hooks`
4. Create a new build hook for the production branch
5. Copy the hook URL
6. Save that value as `NETLIFY_BUILD_HOOK_URL`

## 5. How the automation works

- Netlify scheduled function runs daily
- It triggers the build hook
- The build runs `node scripts/netlify-build-blog.mjs`
- A new blog post is generated and added to `blog-posts.json`
- Netlify deploys the updated site automatically

## 6. Test it

After your first production deploy:

1. Open Netlify `Functions`
2. Open `trigger-daily-blog-build`
3. Click `Run now`
4. Wait for the build to finish
5. Check the deployed `blog.html`

## 7. Important note

Do not commit a real `.env` file. Only keep secrets inside Netlify environment variables.
