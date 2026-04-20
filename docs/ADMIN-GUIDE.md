# PromoShop Admin Dashboard — User Guide

This guide walks you through everything you can edit on the PromoShop site from the **Admin** dashboard. No developer needed — every tab is a simple form.

> **Where is the dashboard?**
> Sign in, then click **Admin** in the top navigation bar. URL: `/admin`.
>
> **Does it save across devices?**
> Changes save **in your current browser** right now. A next-phase update will sync them to our cloud database (Cosmos DB), so your work will carry across devices and teammates automatically. Until then, make edits from whichever browser you'll be demoing in.
>
> **Reset button.** Every tab has a **Reset** button in the top-right. It clears your overrides and restores the defaults that ship with the site. Safe to click — it won't delete anything permanent.
>
> **Save button.** Nothing persists until you click **Save**. If you refresh before saving, your edits are gone.

---

## 1 · Products tab — add or remove catalogue items

Use this when you need to add a new product, take one down, or clean up old SKUs.

### To **view** products
1. Go to `/admin` and click **Products**.
2. You'll see a table of every product currently on the site, with a thumbnail, SKU, category, and brands.
3. Use the search box to filter — type any part of the name, SKU, brand, or category.

### To **add** a product
1. Scroll to the dashed box at the bottom labelled **Add a product**.
2. Fill in:
   - **SKU** — must be unique (e.g. `DRK 005`). Think of it as the product's serial number.
   - **Product name** — what customers see.
   - **Category** — e.g. Drinkware, Tops, Jackets.
   - **Brands** — comma-separated if the product fits under more than one brand.
   - **Gender** — Unisex / Mens / Womens.
   - **Sizes** — comma-separated (e.g. `S, M, L, XL`).
   - **Default colour name + hex** — the first colour customers see. Click the colour square to pick a hex.
   - **Primary image URL** — paste a public image URL (see §6 for how to get one).
   - **Min. qty** — minimum order quantity.
   - **Description** — one-sentence pitch.
3. Click **Add product**. A row appears in the table above.
4. Click **Save** in the top-right. Done.

### To **remove** a product
1. Find it in the table (search by name if the list is long).
2. Click the trash icon on the right.
3. Click **Save**.

---

## 2 · Brands tab — add, remove, and edit brand records

This is also where brand **logos** are configured. Each brand card shows a live logo preview — if the preview shows an "X" icon, that brand is missing a logo.

### To **see** which brands have logos
1. Go to `/admin` and click **Brands**.
2. Every brand card has a small preview box on the left. If it's filled in, the brand has a logo. If you see a little "X" icon, it's missing.

### To **add a logo to an existing brand**
You have two options:

**Option A — paste a URL (fastest if you already have the image online):**
1. Find the brand card.
2. Paste the full image URL into the **Logo URL** field. The preview updates the moment you paste.
3. Click **Save**.

**Option B — upload a file (if the image is on your computer):**
1. Click the **Images** tab.
2. Scroll to the **Brand logos** group.
3. Find the brand (e.g. "YETI — brand logo").
4. Click the upload button and pick the file from your computer.
5. Go back to the **Brands** tab to confirm the preview updated.
6. Click **Save**.

### To **add a brand lifestyle image** (the photo behind the logo on the brand detail page)
1. Go to **Images** tab → **Brand lifestyle** group.
2. Find the brand (e.g. "Patagonia — lifestyle background").
3. Upload a wide landscape photo (around 1600×600 px works well).
4. Visit `/brands/patagonia` in another tab — you'll see the photo behind the logo card.

### To **add a new brand**
1. Scroll to the dashed **Add a brand** box.
2. Fill in name, slug (auto-fills if blank), logo URL, description, categories (comma-separated).
3. Check **Featured** if you want it to appear in the top grid on `/brands`.
4. Click **Add brand** then **Save**.

### To **remove** a brand
1. Click the trash icon on the brand's card.
2. Click **Save**.

---

## 3 · Team tab — edit the roster shown on the About page

### To **edit a team member**
1. Go to `/admin` → **Team**.
2. Click directly on the name, role, bio, or image URL fields and type. Changes are tracked immediately (the **Save** button turns red when there are unsaved changes).
3. Click **Save**. Open `/about` in another tab — you'll see the change live.

### To **add a team member**
1. Scroll to the **Add a team member** box.
2. Fill in name, role, bio, and optionally an image URL.
3. Click **Add member** then **Save**.

### To **remove a team member**
1. Click the trash icon on their card.
2. Click **Save**.

> **Tip:** If you don't have a photo URL, upload the picture via the **Images** tab under the "Team members" group and leave the Team-tab image field blank — the site will pull the photo from the image manager automatically.

---

## 4 · Images tab — upload/replace any image on the site

This is the universal image manager. Every image slot on the site is listed here, grouped by where it appears.

### Groups you'll see
- **Branding** — the PromoShop Studio logo (header + footer).
- **Home page** — the four home slideshow frames.
- **About page** — the big hero photo on `/about`.
- **Team members** — one slot per team member's portrait.
- **Brand logos** — one slot per brand for the scrolling reel.
- **Brand lifestyle** — the background photo behind each brand logo on the brand detail page.

### To **replace** an image
1. Find the slot (use the search/filter at the top if needed).
2. Click **Upload** and pick a file.
3. The image is uploaded to our Azure Blob Storage and the site swaps to it within a second.

### To **revert** to the original image shipped with the site
1. Click **Reset** on the slot.

---

## 5 · Theme tab — change the brand colours

Four colour pickers control the whole site's palette through CSS variables.

- **Primary** — red by default (`#ef473f`). This colour drives every call-to-action button, active link, and highlight.
- **Accent** — sky blue (`#bde7ff`). Used for the brand scroll background, footer accent band, and highlight strips.
- **Surface** — white (`#ffffff`). Card + panel backgrounds.
- **Text** — near-black (`#111111`). Body copy.

### To **change a colour**
1. Go to `/admin` → **Theme**.
2. Click the coloured square next to the colour you want to change. A native picker opens. Or paste a hex code directly into the text field.
3. Watch the live preview panel at the bottom update in real time.
4. Click **Save**. The whole site picks up the new colours instantly.

### To **reset to the original palette**
Click **Reset** in the top-right.

---

## 6 · Where do I get an image URL to paste?

Quick options:
1. **Already on the PromoShop site or our GitHub repo** — right-click any image on the public site and choose "Copy image address."
2. **Already in a Google Drive or Dropbox** — share publicly, copy the direct link.
3. **On your computer** — skip the URL. Use the **Images** tab upload button instead.

---

## 7 · Order we recommend for the first setup pass

1. **Theme** — confirm the red/blue/white palette matches PromoShop brand guidelines.
2. **Images → Branding** — upload the latest PromoShop Studio logo if it's changed.
3. **Images → Home page** — upload the four slideshow images.
4. **Brands** — add any missing brand logos. Any brand card showing the "X" icon needs attention.
5. **Images → Brand lifestyle** — upload a lifestyle photo per brand so `/brands/patagonia`, `/brands/yeti`, etc. don't look bare.
6. **Team** — confirm the four names, titles, bios, and upload photos under **Images → Team members**.
7. **Products** — add any SKU that's missing from the catalogue.

Once each section looks right, click **Save** on every tab you touched. Then open the public site in a fresh tab and walk through it top-to-bottom.

---

## Troubleshooting

**My change isn't showing up on the public site.**
- Did you click **Save**? (Unsaved changes turn the Save button red.)
- Are you on the same browser? Today's storage is per-browser.
- Hard-refresh with `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac).

**The logo preview shows an "X" after I paste a URL.**
- The URL is either wrong, behind a login, or the hosting service blocks embedding. Try a different URL or upload via the **Images** tab instead.

**I accidentally deleted something.**
- Click **Reset** in that tab to restore the default roster / brand list / product list that ships with the site. You'll lose your other unsaved edits in that tab — that's the tradeoff.

**Something broke and the site won't load.**
- Open the browser console (F12 → Console). Screenshot the red errors and send them to your developer.

---

_Questions or requests not covered here? Email the dev team and we'll ship a new tab._
