# TELEGANT website changes log

Each change is its own commit. To undo one: `git revert <hash>` (or revert the merged PR commit for that change). Nothing else was touched.

| # | Commit | What changed | Why | Files |
|---|--------|--------------|-----|-------|
| 1 | 7c2b497 | Removed duplicate Supabase library and tg-core.js script tags at the end of about.html. Added cart, size-guide, colors and login pages to sitemap.xml. | Scripts loaded twice on the About page (can double-initialise). Sitemap missed pages. | about.html, sitemap.xml |
| 2 | ea2b202 | Shop: "Add to Cart" is now the same size as "Buy Now". | It had a 1px border and wide side padding, so it was taller and wrapped to two lines on narrow phone cards. | tg-theme.css (appended rule) |
| 3 | a87d9d7 | Light theme only: darker gold for the "Add to Cart" text/outline and the "Learn more about sizes" link. | Colours were hardcoded for the dark theme and were hard to read on the cream background. Dark theme is unchanged. | tg-theme.css (appended rules) |

Revert examples: `git revert a87d9d7`, `git revert ea2b202`, `git revert 7c2b497`.
Not changed on purpose: login.html (no real bug found), account.html (old redirect page), order data.
