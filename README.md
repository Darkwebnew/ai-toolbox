# My AI Toolbox

A searchable directory of 500+ established AI tools across 30 categories, filterable by category and price. Plain HTML, CSS and JavaScript — no build step.

## Files
- `index.html` – the page
- `style.css` – the look
- `script.js` – search, category and price filters
- `tools.js` – the list of tools (edit this one to add or remove tools)

## Add a tool
Open `tools.js` and add a line like this inside `TOOLS`:

```js
t("Tool name", "https://example.com/", "What it does", "image", "freemium"),
```

- Category is one of the ids at the top of `tools.js` (chat, research, writing, image, video, audio, music, design, 3d, slides, apps, code, build, auto, email, marketing, social, seo, sales, support, ecommerce, data, education, careers, finance, legal, translation, productivity, learn, util).
- To add a new category, add a line to `CATEGORIES` with a new id and name.
- Price is one of: `free`, `freemium` (has a free plan), `paid`.

## Host it free on GitHub Pages
1. Create a new public repository on GitHub.
2. Upload these four files (keep them at the top level, not in a folder).
3. Go to **Settings → Pages**, set **Source** to “Deploy from a branch”, pick `main` and `/ (root)`, and save.
4. After a minute your site is live at `https://<your-username>.github.io/<repo-name>/`.
