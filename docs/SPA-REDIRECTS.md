# SPA redirects: /truthordare and /trivia must serve index.html

The app is a single-page application (SPA). Routes like `/truthordare` and `/trivia` exist only in the client-side router. If you open or refresh `https://yoursite.com/truthordare`, the **server** must respond with `index.html` (and 200), not 404. Otherwise the path “doesn’t show the games.”

## AWS Amplify

1. In **Amplify Console** → your app → **Hosting** → **Redirects and rewrites** (or **App settings** → **Redirects**).
2. Add a **Rewrite (200)** so all paths serve `index.html` (required for `/truthordare` and `/trivia` to work when opened or refreshed).

   **Option A – Simple catch‑all (easiest)**  
   - **Source:** `/<<*>>`  
   - **Target:** `/index.html`  
   - **Type:** **Rewrite (200)**

   **Option B – Regex (skip real files like .js, .css)**  
   - **Source:** `<<</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp)$)([^.]+$)/>>`  
   - **Target:** `/index.html`  
   - **Type:** **Rewrite (200)**

   **Paste as JSON (Console “Edit” → paste, then save):**  
   ```json
   [
     {
       "source": "/<<*>>",
       "status": "200",
       "target": "/index.html",
       "condition": null
     }
   ]
   ```
   If you already have other redirect rules, add this object to the array and keep it **after** any more specific rules.

3. Save and redeploy. Then open or refresh `https://yoursite.com/truthordare` or `https://yoursite.com/trivia` — the app should load and show the game.

After this, opening or refreshing `https://yoursite.com/truthordare` or `https://yoursite.com/trivia` will serve `index.html` and the React router will show the correct game.

## Other hosts

- **S3 + CloudFront:** In CloudFront, add **Custom error responses**: for **403** and **404**, set **Response page path** to `/index.html` and **HTTP response code** to **200**.
- **Netlify:** Add a `public/_redirects` file (or `_redirects` in the build output) with:  
  `/*    /index.html   200`
- **Vercel:** Usually handles SPAs by default; if not, add a `vercel.json` rewrite: `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`

## Local dev

With `npm run dev` (Vite), the dev server already serves `index.html` for all paths, so `/truthordare` and `/trivia` work without any extra config.
