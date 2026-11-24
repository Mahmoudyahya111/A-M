# TELEGANT website changes log

Each change is its own commit. To undo one: `git revert <hash>` (or revert the merged PR commit for that change). Nothing else was touched.

| # | Commit | What changed | Why | Files |
|---|--------|--------------|-----|-------|
| 1 | 7c2b497 | Removed duplicate Supabase library and tg-core.js script tags at the end of about.html. Added cart, size-guide, colors and login pages to sitemap.xml. | Scripts loaded twice on the About page (can double-initialise). Sitemap missed pages. | about.html, sitemap.xml |
| 2 | ea2b202 | Shop: "Add to Cart" is now the same size as "Buy Now". | It had a 1px border and wide side padding, so it was taller and wrapped to two lines on narrow phone cards. | tg-theme.css (appended rule) |
| 4 | 0f18ddd | Pattern maker engine: added a model list (MODELS at the top of tg-pattern.js). Each model keeps its own collar height, front/back neck drop, fabric and photo. The mock neck now uses the higher collar seen in the shop photos: collar 5.5 cm (was 4.5) and front neck drop 4 cm (was 7). | Both numbers are estimates from the photos, +/- about 1 cm. | tg-pattern.js |
| 5 | c538dc0 | Admin pattern maker page: model picker next to the size picker, with the model's photo shown beside the measurements. Choosing a model fills its settings and fabric; the PDF uses the model photo when no photo is uploaded. "Save as model" adds a new model from the page (kept in the browser), so new models need no code change; a permanent model is one line in the MODELS list in tg-pattern.js. | User wants patterns by size AND model, with model photos. | admin.html |
| 3 | a87d9d7 | Light theme only: darker gold for the "Add to Cart" text/outline and the "Learn more about sizes" link. | Colours were hardcoded for the dark theme and were hard to read on the cream background. Dark theme is unchanged. | tg-theme.css (appended rules) |

| 6 | 4b876e1 | NEW IN nav link now points to shop.html#newin on every page, and shop.html has the matching anchor. | The link was a dead #newin anchor on all 11 pages (no such element existed), so it did nothing when clicked. | all public .html nav blocks, shop.html |
| 7 | 02dcae3 | About page og:image now uses MEBG-GOLDEN.png. | It pointed to NEBG.png, which does not exist in the repo, so social shares showed no image. | about.html |
| 8 | 4c11b1f | Track page "not found" message now says to sign in with the account used to order. | The old text said "on this device/browser", but the lookup is account-based in Supabase, not device-based. Wording was misleading. | track.html |
| 9 | 6d7aa93 | Survey form submits with mode no-cors and treats the opaque response as success. | The Apps Script endpoint answers with a redirect that has no CORS headers, so fetch threw and the page showed "Something went wrong" even though the answer was recorded - causing duplicate submissions. | Survey.html |
| 10 | 65788e1 | Product cards use class img-cont instead of a duplicated id img-cont. | The same id appeared 5 times on shop.html (and in the catalog template); duplicate ids are invalid HTML and break tooling/anchors. | shop.html, catalog.html, telegant.css |
| 11 | 02876ed | Menu links added by tg-nav.js (Size guide, Colour guide, and any DB-driven pages) now re-translate when the language toggle is used. | They were rendered once in the language at page load and stayed stale after switching to Arabic/English. | tg-nav.js |
| 12 | be62fe3 | Removed the dead track-page strings that were copied into size-guide.html's i18n dict. | Dead wrong keys (a landmine for future edits). The page uses its own data-k dict; nav/footer keys unchanged. | size-guide.html |
| 13 | 4535d58 | Sitemap no longer lists cart.html and login.html. | Both pages are noindex, so listing them contradicts the SEO signal. | sitemap.xml |
| 14 | 8ed5dca | The PWA manifest is linked on all public pages. | It was only linked from terms.html. | all public .html heads |
| 15 | 59b34ce | Cart merges duplicate lines of the same product+size into one line with higher quantity, and product names render in the current language. | Adding the same shirt twice (or once in Arabic and once in English) created separate cart lines; names stayed stuck in the language they were added in. | telegant-shop.js, cart.html |
| 16 | aa0df44 | Cart page re-renders items, totals and the delivery-date grid when the language is toggled. | Item names and "N orders so far" labels stayed in the previous language until reload. | cart.html |
| 17 | da01bc2 | Delivery-date labels on the cart page are formatted in the site language. | Day/month names stayed in the browser's language (English) in Arabic mode. | telegant-shop.js |
| 18 | d019247 | Thank-you screen no longer claims a confirmation email was sent (email backend is off), and its Track button opens track.html prefilled with the order number. The dead account.html demo-auth code is neutralised inside an inert template tag (file kept, still redirects to login). | The email claim was false while swift-action is down. Owner asked to hide, not delete, account.html. | tg-store.js, account.html |
| 19 | 5ad64fc | Guest checkout: guests add to cart and place orders with an email, no account; guests track with order number + checkout email; sign-in links past guest orders to the account (claim_my_orders). Needs supabase-guest-checkout.sql run in the Supabase SQL editor before guests can finish checkout; until then a guest sees "Please sign in to place an order" at Place Order. | Owner decision 24 Nov: order saved on the email, account only to review all orders. | tg-buy.js, tg-store.js, cart.html, track.html, login.html, supabase-guest-checkout.sql (new) |
| 20 | 2693813 | Order confirmation email now also works for guests: cart.html sends the checkout email with the confirm call, and the swift-action edge function (v12) lets a not-signed-in caller trigger only the confirm for an order with no account whose email matches. Edge function was also redeployed (v11) to fix a boot failure. | Guest orders never got a confirmation email because the function required a signed-in user. | cart.html; Supabase function swift-action (source not in repo, backup of v10 kept) |
| 21 | 27a80be | Thank-you screen says again that a confirmation email is on its way (and to save the number to track the order). The Track button still opens track.html prefilled. | Order emails work again (edge function fixed, tested for guest and signed-in orders, mail received in the test inbox), so the earlier wording from d019247 is true again. | tg-store.js |
| 22 | 25eb05c | Pattern maker: removed the "Read measurements from the photo (AI)" button, its scale inputs, and the auto-run when a photo is picked. "Measure on the photo by hand" and the "Prefer to use another AI tool yourself?" card stay. | The AI button needs an Anthropic API key on the Supabase function; the owner decided not to get one, so the button could only ever fail. | admin.html |
| 23 | 045b61b | PDF reports load the jsPDF autotable plugin only after jsPDF itself has loaded. Before, both scripts loaded in parallel and the plugin could run first, so every PDF button (Business report, Statement, Styling, Service KPIs, Agents) failed with "doc.autoTable is not a function". | Race between the two CDN scripts; seen failing on the Accounting page. Excel exports were unaffected. | tg-report.js |

Revert examples: `git revert c538dc0`, `git revert 0f18ddd`, `git revert a87d9d7`.
Not changed on purpose: login.html (no real bug found), account.html (old redirect page), order data.
| 24 | (this commit) | Restored the pattern maker "Read measurements from the photo (AI)" button, its scale inputs and the auto-run on photo pick (reverts 25eb05c / entry 22). | The owner decided to leave the button on the page as is. Note: the button still needs an Anthropic API key on the backend to work; until then it shows an error and points to the manual options. | admin.html |
| 25 | (this commit) | Admin "Marketing" tab (owner only): strategy planner, content calendar, AR/EN caption and ad templates filled from the live products, branded post/story image designer (PNG), video shot lists and scripts with PDF, campaign tracker with ROI, discount ideas, cheap video tools list (prices from official pages, checked 2026-11-24). Templates only, no AI service. New table marketing_items (owner-only RLS, additive; rollback is dropping that table). | Owner asked for a marketing workspace without a paid AI key. | admin.html, tg-marketing.js, supabase-marketing.sql, CHANGES.md |
| 26 | (this commit) | Marketing: Arabic video shot lists and scripts (so the Arabic PDF is not mixed with English). | The Arabic video PDF mixed languages. | tg-marketing.js, admin.html, CHANGES.md |
| 27 | (this commit) | Marketing: batch content. Pick products from the live product list (category filter, in-stock only), number of posts, start date and spacing, language, size, theme and content mix; makes a caption and image per post, each editable; add all to the calendar as drafts, copy all text, download all images as a ZIP or one by one. Templates only, no AI. No schema change. | Owner wants content for many posts at once. | tg-marketing.js, admin.html, CHANGES.md |

## 28. Facebook (Meta) Pixel + campaign attribution (TELEGANT)
- New tg-pixel.js on public pages (after tg-core.js). Loads Meta code ONLY if an owner saved a numeric ID (site_settings key `pixel`, public read, owner write already by RLS). Events: PageView, ViewContent (Buy now / Add to cart click), AddToCart (wraps TelegantShop.Cart.add), InitiateCheckout (cart page), Purchase (after TG.placeOrder, EGP), Contact (WhatsApp/chat click).
- UTM/fbclid kept 30 days in localStorage (tg_utm) and sent with the order: new nullable column orders.attribution jsonb; place_order patched to store it (old definition: backups/place_order-before-attribution.sql).
- Admin > Marketing section 9: Pixel ID field (validated), Save, Remove, Check status, Test Events steps, consent note, UTM link builder.
- Revert: git revert this commit (column can stay).

## 29. Owner password management (TELEGANT)
- New edge function `admin-passwords` (supabase/functions/admin-passwords/index.ts, deployed, verify_jwt on). Owner-only (checked server-side from profiles). Actions: set_password, generate_password (server makes a 14-char random password with crypto RNG, returns it once, never stores/logs it). Cannot change another owner's password. Existing `admin-users` function untouched. No DB change.
- Admin > Users: "Set / generate password" button per user, and a "Generate" button beside the password field of Add user.
- Revert: git revert + delete the function.

## 30. Security fix: anonymous callers could run staff-only database functions (TELEGANT)
- Found: confirm_payment, refund_order, chat_claim/close/transfer, set_order_photo, confirm_delivery and others checked the role with `my_role() <> 'owner'`, which is NULL (not true) for signed-out visitors, so the check was skipped. Verified with a signed-out call to confirm_payment (it ran).
- Fix (no design change): REVOKE EXECUTE from anon/public on staff-only functions (confirm_payment, refund_order, chat_claim, chat_close, chat_transfer, set_order_photo, set_order_status, confirm_delivery, cancel_order, staff_orders, staff_list, set_presence, set_my_alias, claim_my_orders, service_report, csat_report). Signed-in users unchanged. place_order, track_order and chat start are untouched.
- Backups of previous grants: backups/grants-before-revoke-anon*.json. Revert: GRANT EXECUTE ... TO anon.
- A stray test event row made by the probe (order_events id 185) was deleted.
- Correction: delivery_counts is used by the signed-out cart (delivery-date capacity, only aggregate counts) so anon access was restored.

## 31. SEO tidy (TELEGANT, head tags only, no visual change)
- Added Open Graph and Twitter card tags to colors, size-guide and terms (og:image added to terms). Pages already had title, description, canonical, JSON-LD (home/shop), sitemap and robots.

## 32. Fix: sideways scroll on phone for login/account and chat survey (TELEGANT)
- The login card was 100% wide plus padding, so it overflowed a 375px screen by about 10px. Added box-sizing:border-box to .box in the affected pages. Same look, no horizontal scroll.

## 33. Pages on/off for every page (TELEGANT)
- New table site_pages (file, title, essential, active). Additive, no existing table touched, so no backup needed. Public read, owner-only write (is_owner()). Seeded with the 12 public pages.
- New tg-guard.js on the public pages: a hidden page shows "This page is not available" (AR/EN), is set to noindex, and its links disappear from menu and footer.
- Admin > Pages: new "Website pages" card with Hide/Activate per page; essential pages (home, shop, category/product, cart and checkout, account, terms) ask for a warning confirmation. Created pages below now say Hide/Activate too (they already had the toggle).
- Limit: sitemap.xml is a static file on GitHub Pages, it cannot change when a toggle changes. Hidden pages carry noindex, so Google drops them after the next crawl. Edit sitemap.xml too if a page is hidden for good.
- Revert: remove the tg-guard.js script tags (drop table optional).

## 34. Delete pages with restore (TELEGANT)
- DB additive: site_pages.deleted column, new table pages_trash (owner-only) that stores a full copy of a created page before it is deleted.
- Admin > Pages: Delete on every non-essential built-in page (soft delete: it leaves menu, footer and Google and the URL shows "Page not found"; Restore brings it back, because the page files live in the website code). Essential pages (home, shop, category/product, cart and checkout, account, terms) cannot be deleted, the admin explains and offers Hide.
- Created pages: Delete saves a copy to pages_trash first (if the copy fails nothing is deleted), "Deleted pages" list has Restore.
- Hidden/deleted page message now sits between header and footer.
- Note: sitemap.xml is static, edit it if a page is removed for good.

## 35. TELEGANT SEO re-audit fixes (no visual change)
- Survey: added a visually hidden h1 (page had none). About: the second h1 is now a level-2 heading for crawlers (looks identical). Home: added WebSite structured data next to the ClothingStore data.

## 36. "Back to website" button in the admin header (TELEGANT)
- New button at the left of the admin header actions (same style as Chat console). Opens the home page; the admin session stays signed in, nothing is signed out.

## 37. Analytics: Meta ads visitors per page and campaigns (no design change)
- DB additive (sql/analytics-meta.sql): nullable columns on page_events (utm_source, utm_medium, utm_campaign, utm_content, has_fbclid, ref_host, channel, platform, inapp), a BEFORE INSERT trigger that classifies the channel on the server (meta_paid, meta_click, meta_organic, referral, direct), function meta_ads_summary (owner only). Existing rows, policies and the page_stats view are untouched; old rows have no channel and are not counted as ad traffic.
- tg-core.js: the existing visit tracking now also records the UTM tags, Meta click id (fbclid flag), referrer host and in-app browser flag on the view event, kept for the whole visit. Writes to TELEGANT's own project only (vjnaaubbxpqlolvgtweo, from tg-core.js). tg-core.js is now cache-busted (?v=) on all pages.
- Admin > Analytics: the existing table is unchanged; below it a new "Meta ads visitors per page" section and a Campaigns table. Until a Pixel ID is saved and an ad-sourced visit exists it shows "No data yet. Add your Pixel ID in Marketing and run ads with UTM links."
- Limits stated on the page: in-app browsers and ad blockers undercount; campaign detail needs UTM links.
