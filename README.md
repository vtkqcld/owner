# SkyWorld Prototype

Two separate websites (HTML/CSS/JS):

- `owner/`  – Stall Owner Portal (inventory, online store orders, reports, settings, profile)
- `store/`  – Customer Online Shop (no login — opens straight to choosing a category + stall 1–105 → that stall's store, plus a Reviews page)
- `shared/` – shared "database" (`db.js`, localStorage) so inventory and orders stay in sync, plus `shared.css` (royal blue / powder blue / cream theme, captcha, animations)

## How to run
Don't double-click index.html. Use a local server so the sync works:

    cd skyworld
    python3 -m http.server 8000

Owner portal: http://localhost:8000/owner/   Customer store: http://localhost:8000/store/

## Accounts
- Owner: stall1@skyworld.ph … stall100@skyworld.ph, password `Owner@123`
- Customer: no login needed (each browser is a guest shopper)
- Vouchers: SKY50, STALL10, WELCOME
- Owner login: 5 wrong attempts = 30s lock. Forgot password: the code appears in a toast (demo email).
- Captcha: type the jumbled letters and numbers shown.
- Logo: replace `shared/logo.png` with your own image (same file name). It is used on the owner login, owner sidebar, store header and browser tab icon.

## Stock status
- Out of Stock: quantity = 0
- Low Stock: quantity 1–10
- In Stock: quantity 11 or more
Quantity goes down when an order is placed and is restored when it is cancelled.

## Reviews
- Store: header ⭐ Reviews → pick a purchased product → rating (required), comment, up to 3 pictures.
- Owner: Settings → Reviews (below Notifications) shows ratings, comments and pictures. The owner is also notified of new reviews.

## Privacy & payments (store)
- Every new visit/tab of the store link starts a blank guest shopper (no saved delivery address, cart or linked accounts). The same visitor keeps their info while the tab stays open, so they can still review purchases.
- GCash / Maya / BDO / BPI open the real website in a new tab when linking and when placing the order (prototype: payment is not verified).

## Deploying owner and store separately (GitHub Pages + Supabase)
The owner portal and the customer store can live in two different repositories / web addresses and still share one database.

1. Create a free project at supabase.com. Open **SQL Editor**, paste `setup.sql`, press **Run**.
2. In Supabase open **Project Settings -> API**. Copy the **Project URL** and the **anon public** key.
3. Put the SAME two values in `shared/config.js` of BOTH sites (`supabaseUrl`, `supabaseKey`).
4. In the OWNER site's `shared/config.js` also set `storeUrl` to your deployed store address, e.g. `https://yourname.github.io/skyworld-store/` (this is what "Open my store" uses).
5. Repo for the owner: upload this folder (open `/owner/`). Repo for the customers: upload the separate **store-only zip** (it has no owner portal files). Turn on GitHub Pages for each repo (Settings -> Pages -> main branch / root).

If `supabaseUrl` / `supabaseKey` are empty the system runs in local mode (one browser only), exactly like before.

Prototype note: the anon key is visible in any website's source, and this prototype keeps everything (including demo owner logins) in one shared table. That is fine for a school demo, but a real launch needs proper Supabase Auth + per-table security rules.
