# Upload and Analytics

## Upload the site

Upload these files to your hosting or drag the project folder into Netlify:

- `index.html`
- `services.html`
- `pricing.html`
- `about.html`
- `contact.html`
- `style.css`
- `analytics.js`
- `robots.txt`
- `sitemap.xml`
- other legal pages and image assets

## Add Google Analytics 4

1. Create a GA4 property in Google Analytics.
2. Open your web data stream.
3. Copy the Measurement ID. It starts with `G-`.
4. Open `analytics.js`.
5. Replace `G-XXXXXXXXXX` with your real ID.
6. Upload the updated files again.

Google's current GA4 docs for measurement IDs and manual tagging:

- https://support.google.com/analytics/answer/12270356
- https://support.google.com/analytics/answer/9539598

## Check if analytics is working

After upload:

1. Open your website in a browser.
2. In Google Analytics, go to `Reports` or `Realtime`.
3. Visit a few pages on your site.
4. Wait a minute and confirm your visit appears.

## Notes

- If `analytics.js` still contains `G-XXXXXXXXXX`, tracking stays off.
- This keeps the site safe to upload before you are ready to enable analytics.
