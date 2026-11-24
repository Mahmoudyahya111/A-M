# TELEGANT website changes log

Each change is its own commit. To undo one: `git revert <hash>` (or revert the merged PR commit for that change). Nothing else was touched.

| # | Commit | What changed | Why | Files |
|---|--------|--------------|-----|-------|
| 1 | 7c2b497 | Removed duplicate Supabase library and tg-core.js script tags at the end of about.html. Added cart, size-guide, colors and login pages to sitemap.xml. | Scripts loaded twice on the About page (can double-initialise). Sitemap missed pages. | about.html, sitemap.xml |
| 2 | ea2b202 | Shop: "Add to Cart" is now the same size as "Buy Now". | It had a 1px border and wide side padding, so it was taller and wrapped to two lines on narrow phone cards. | tg-theme.css (appended rule) |
| 4 | 0f18ddd | Pattern maker engine: added a model list (MODELS at the top of tg-pattern.js). Each model keeps its own collar height, front/back neck drop, fabric and photo. The mock neck now uses the higher collar seen in the shop photos: collar 5.5 cm (was 4.5) and front neck drop 4 cm (was 7). | Both numbers are estimates from the photos, +/- about 1 cm. | tg-pattern.js |
| 5 | c538dc0 | Admin pattern maker page: model picker next to the size picker, with the model's photo shown beside the measurements. Choosing a model fills its settings and fabric; the PDF uses the model photo when no photo is uploaded. "Save as model" adds a new model from the page (kept in the browser), so new models need no code change; a permanent model is one line in the MODELS list in tg-pattern.js. | User wants patterns by size AND model, with model photos. | admin.html |
| 3 | a87d9d7 | Light theme only: darker gold for the "Add to Cart" text/outline and the "Learn more about sizes" link. | Colours were hardcoded for the dark theme and were hard to read on the cream background. Dark theme is unchanged. | tg-theme.css (appended rules) |

Revert examples: `git revert c538dc0`, `git revert 0f18ddd`, `git revert a87d9d7`.
Not changed on purpose: login.html (no real bug found), account.html (old redirect page), order data.
