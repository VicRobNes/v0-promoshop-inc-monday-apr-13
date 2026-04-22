# PromoShop Inc. Website Management Guide

**Welcome, Abigail!** This guide will walk you through everything you need to manage the PromoShop website. Don't worry if you're not technical — this guide is written just for you, with step-by-step instructions in plain English.

---

## Table of Contents

1. [How the Site Works](#1-how-the-site-works)
2. [Logging Into the Admin Panel](#2-logging-into-the-admin-panel)
3. [The Admin Dashboard](#3-the-admin-dashboard)
4. [Managing Products](#4-managing-products)
5. [Managing Brands](#5-managing-brands)
6. [Managing Hero Slides (Big Banner Images)](#6-managing-hero-slides-big-banner-images)
7. [Managing Quote Requests](#7-managing-quote-requests)
8. [Settings](#8-settings)
9. [Changing Website Text Not in Admin](#9-changing-website-text-not-in-admin)
10. [How Changes Go Live](#10-how-changes-go-live)
11. [One-Time Setup Guide](#11-one-time-setup-guide-for-developer-or-starting-over)
12. [Integrations & Pricing](#12-integrations--pricing-2025)
13. [Troubleshooting](#13-troubleshooting)
14. [Key Links](#14-key-links)

---

## 1. How the Site Works

The PromoShop website is built with 4 main tools that work together. Here's what each one does:

### The 4 Tools

| Tool | What It Does | Do You Use It? |
|------|--------------|----------------|
| **v0** | This is where the website was built. It's like a smart design assistant that writes code for us. | Rarely — only for text changes not in admin |
| **GitHub** | This stores all the website code, like a filing cabinet for files. | Never — the developer handles this |
| **Vercel** | This is where the website "lives" on the internet. It takes the code and makes it available at your web address. | Rarely — only to check if something deployed |
| **Supabase** | This is the database — it stores all your products, brands, images, and quote requests. | Never directly — you use the Admin Panel instead |

### The Admin Panel (Your Main Tool!)

The Admin Panel at `/admin` is where you'll spend 99% of your time. It's a friendly interface that lets you:
- Add, edit, and delete products
- Manage brands and their logos
- Update the big banner images on the homepage
- View and respond to quote requests
- Change some website settings

💡 **Tip:** Think of the Admin Panel as your control center. Everything you need is there!

---

## 2. Logging Into the Admin Panel

### How to Log In

1. Open your web browser (Chrome, Safari, Firefox, etc.)
2. Go to: `https://[your-domain]/admin`
   - Replace `[your-domain]` with your actual website address
   - Example: `https://promoshop.com/admin`
3. You'll see a login screen with the PromoShop logo
4. Enter your email address
5. Enter your password
6. Click the **"Sign In"** button

💡 **Tip:** Bookmark this page so you can find it easily next time!

### Forgot Your Password?

1. On the login screen, click **"Forgot password?"** (if available)
2. Enter your email address
3. Check your email for a password reset link
4. Click the link and create a new password
5. Go back to the login page and sign in with your new password

⚠️ **Warning:** If you don't see a "Forgot password" link, ask your developer to reset your password through Supabase.

### How to Log Out

1. Look at the bottom of the left sidebar
2. Click your name/email
3. Click **"Log Out"**

### What If I Get "Access Denied"?

If you can log in but see an "Access Denied" or "Not Authorized" message, it means your email isn't in the admin list yet. Here's what to do:

1. Contact your developer
2. Ask them to add your email to the `admin_users` table in Supabase
3. Once they confirm it's done, try logging in again

💡 **Tip:** Make sure you're using the exact email address that was added to the system (check for typos!).

---

## 3. The Admin Dashboard

When you first log in, you'll see the Dashboard. This is your home base!

### The Sidebar (Left Side)

The sidebar is your navigation menu. Click any item to go to that section:

| Menu Item | What It Does |
|-----------|--------------|
| **Dashboard** | Overview with stats and recent activity |
| **Products** | Add, edit, delete products |
| **Brands** | Manage brand names and logos |
| **Hero Slides** | Control the big banner images on the homepage |
| **Quotes** | View and manage customer quote requests |
| **Settings** | Change site-wide settings |

### Stats Cards

At the top of the Dashboard, you'll see colorful cards showing:
- **Total Products** — How many products are in your catalog
- **Active Brands** — How many brands are currently showing on the site
- **New Quotes** — Quote requests that haven't been handled yet
- **Pending Quotes** — Quotes you're currently working on

### Recent Quotes Preview

Below the stats, you'll see a list of the most recent quote requests. This helps you quickly see if any new requests came in without going to the full Quotes page.

---

## 4. Managing Products

Products are the promotional items you offer (pens, mugs, t-shirts, etc.).

### Viewing All Products

1. Click **"Products"** in the sidebar
2. You'll see a table showing all products
3. Use the search box to find specific products

### Adding a New Product

1. Click **"Products"** in the sidebar
2. Click the **"Add Product"** button (usually top-right)
3. Fill in the form:

| Field | What to Enter | Required? |
|-------|---------------|-----------|
| **Name** | The product name (e.g., "Custom Ballpoint Pen") | Yes |
| **Brand** | Select from the dropdown list | Yes |
| **Description** | Full details about the product. You can write multiple paragraphs. | No |
| **Short Description** | A brief 1-2 sentence summary. Shows in product cards. | No |
| **Category** | Type of product (e.g., "Writing Instruments", "Drinkware") | No |
| **Tags** | Keywords separated by commas (e.g., "pens, office, promotional") | No |
| **Featured** | Toggle ON to highlight this product on the homepage | No |
| **Active** | Toggle ON to show on website, OFF to hide it | Yes |
| **Image** | Upload a product photo | Recommended |

4. Click **"Save"** or **"Create Product"**

💡 **Tip for Images:**
- Best size: **800 x 800 pixels** (square works great)
- Formats accepted: **JPG, PNG, or WebP**
- Maximum file size: **10 MB**
- Use a clean, white background when possible

### Editing a Product

1. Click **"Products"** in the sidebar
2. Find the product you want to edit
3. Click the **"Edit"** button (pencil icon) or click the product row
4. Make your changes
5. Click **"Save"** or **"Update"**

### Deleting a Product

1. Click **"Products"** in the sidebar
2. Find the product you want to delete
3. Click the **"Delete"** button (trash icon)
4. Confirm when asked

⚠️ **Warning:** Deleting a product is **permanent**! There's no undo. If you might want the product back later, just toggle "Active" to OFF instead.

### Uploading or Changing Product Images

1. While adding or editing a product, look for the image section
2. Click **"Choose File"** or drag and drop an image
3. Wait for the upload to complete (you'll see a preview)
4. Save the product

💡 **Tip:** If an image looks blurry, try uploading a larger, higher-quality version.

---

## 5. Managing Brands

Brands are the companies whose products you carry (like Nike, Yeti, etc.).

### Viewing All Brands

1. Click **"Brands"** in the sidebar
2. You'll see a list of all brands with their logos

### Adding a New Brand

1. Click **"Brands"** in the sidebar
2. Click **"Add Brand"**
3. Fill in the form:

| Field | What to Enter | Required? |
|-------|---------------|-----------|
| **Name** | The brand name (e.g., "Nike") | Yes |
| **Slug** | Auto-generated from the name (you don't need to touch this) | Auto |
| **Website URL** | The brand's website (e.g., "https://nike.com") | No |
| **Logo** | Upload the brand's logo | Recommended |
| **Active** | Toggle ON to show on website | Yes |
| **Sort Order** | A number to control the display order | No |

4. Click **"Save"**

💡 **Tip for Logos:**
- **Transparent PNG** or **SVG** files work best
- These look clean on any background color
- Aim for at least **200 x 200 pixels**

### Understanding Sort Order

Sort order controls where the brand appears in lists:
- **Lower numbers appear first** (1 shows before 2, 2 before 3, etc.)
- Brands with the same number are sorted alphabetically
- Leave blank or use 0 for default ordering

Example:
- Nike (sort order: 1) — appears first
- Adidas (sort order: 2) — appears second
- Puma (sort order: 3) — appears third

### Editing a Brand

1. Click **"Brands"** in the sidebar
2. Find the brand and click **"Edit"**
3. Make your changes
4. Click **"Save"**

### Deleting a Brand

1. Click **"Brands"** in the sidebar
2. Find the brand and click **"Delete"**
3. Confirm when asked

⚠️ **Warning:** If products are linked to this brand, you may need to reassign them first or delete them.

---

## 6. Managing Hero Slides (Big Banner Images)

Hero slides are the large, eye-catching banner images at the top of your homepage. They rotate automatically to show different promotions or featured items.

### What's in a Hero Slide?

Each slide can have:
- A **big background image** (the main visual)
- A **title** (large text)
- A **subtitle** (smaller text below the title)
- A **CTA button** (CTA = "Call to Action" — the button visitors click)
- A **background color** (shows while image loads or as overlay)

### Viewing All Hero Slides

1. Click **"Hero Slides"** in the sidebar
2. You'll see all your slides with previews

### Adding a New Hero Slide

1. Click **"Hero Slides"** in the sidebar
2. Click **"Add Slide"**
3. Fill in the form:

| Field | What to Enter | Required? |
|-------|---------------|-----------|
| **Title** | Main headline (e.g., "Summer Sale!") | Yes |
| **Subtitle** | Supporting text (e.g., "Save up to 50% on selected items") | No |
| **CTA Button Text** | What the button says (e.g., "Shop Now") | No |
| **CTA Button URL** | Where the button goes (e.g., "/brands" or "https://...") | No |
| **Background Color** | Click to pick a color | No |
| **Image** | Upload the banner image | Yes |
| **Active** | Toggle ON to show, OFF to hide | Yes |
| **Sort Order** | Number to control slide order (lower = first) | No |

4. Click **"Save"**

💡 **Tip for Hero Images:**
- Best size: **1920 x 1080 pixels** (widescreen)
- This size looks great on all screen sizes
- Keep important content (text, faces) toward the center — edges may get cropped on mobile

### Editing a Hero Slide

1. Click **"Hero Slides"** in the sidebar
2. Find the slide and click **"Edit"**
3. Make your changes
4. Click **"Save"**

### Deleting a Hero Slide

1. Click **"Hero Slides"** in the sidebar
2. Find the slide and click **"Delete"**
3. Confirm when asked

### Reordering Slides

To change which slide appears first, second, etc.:
1. Edit each slide
2. Change the **Sort Order** number
3. Lower numbers appear first

Example: If you want "Summer Sale" to show before "New Arrivals":
- Summer Sale: Sort Order = 1
- New Arrivals: Sort Order = 2

---

## 7. Managing Quote Requests

When visitors fill out the contact form on your website asking for a quote, those requests appear here.

### What Is a Quote Request?

When a potential customer wants pricing for promotional items, they fill out a form on your website. That form submission becomes a "quote request" that you can track and respond to.

### Viewing Quote Requests

1. Click **"Quotes"** in the sidebar
2. You'll see a list of all quote requests
3. Newest requests appear at the top

### Understanding Quote Status

Each quote has a status that helps you track where it is in your process:

| Status | What It Means | Color |
|--------|---------------|-------|
| **New** | Just came in, hasn't been looked at yet | Blue |
| **In Progress** | You're working on this quote | Yellow |
| **Completed** | Quote was sent, deal is done | Green |
| **Archived** | Old or no longer relevant | Gray |

### Updating a Quote's Status

1. Click on a quote to open it
2. Find the **Status** dropdown
3. Select the new status
4. Click **"Save"** or it may save automatically

💡 **Tip:** Move quotes to "In Progress" as soon as you start working on them. This helps you (and your team) know what's being handled.

### Adding Admin Notes

Admin notes are internal notes only you and other staff can see. The customer never sees these.

1. Open a quote request
2. Find the **"Admin Notes"** field
3. Type your notes (e.g., "Called customer 4/15, waiting for callback")
4. Save

💡 **Tip:** Use admin notes to track your communication history with each customer!

### Exporting Quotes to CSV

Need to work with quote data in Excel or Google Sheets?

1. Click **"Quotes"** in the sidebar
2. Look for an **"Export"** or **"Download CSV"** button
3. Click it
4. A file will download to your computer
5. Open it in Excel, Google Sheets, or any spreadsheet app

### Filtering by Status

To see only certain quotes:
1. Look for filter buttons or a dropdown near the top
2. Click a status (e.g., "New" to see only new quotes)
3. The list will update to show only matching quotes

---

## 8. Settings

The Settings page lets you change site-wide options.

### How to Access Settings

1. Click **"Settings"** in the sidebar

### Changing CTA Button Text and URL

**What's a CTA?** CTA stands for "Call to Action." It's the button that encourages visitors to take action (like "Get a Quote" or "Shop Now").

To change the main CTA button:
1. Go to Settings
2. Find the **CTA Text** field
3. Type what you want the button to say (e.g., "Request a Quote")
4. Find the **CTA URL** field
5. Enter where the button should go (e.g., "/contact" or "#contact")
6. Save

### Changing Contact Section Text

If there's a contact section setting:
1. Find the contact text fields
2. Update the text as needed
3. Save

### Site Settings (Key-Value Pairs)

Some settings are stored as "key-value pairs." This is just a fancy way of saying:
- **Key** = the name of the setting
- **Value** = what that setting equals

Example:
- Key: `company_phone`
- Value: `555-123-4567`

To add or edit:
1. Find the key-value settings area
2. Enter the key name and its value
3. Save

💡 **Tip:** Don't change keys unless you know what they do — changing a key name might break something that relies on it!

---

## 9. Changing Website Text Not in Admin

Some text on the website (like page titles, paragraphs, or footer content) isn't editable through the admin panel. For those changes, you have two options:

### Option A: Use v0 (Recommended for Non-Technical Users)

v0 is the AI tool that built this website. You can ask it to make text changes!

1. Go to **https://v0.dev** (or v0.app)
2. Log in with the **Nest Digital Solutions Inc team account** (ask your developer for credentials)
3. Find the **PromoShop** project
4. In the chat, describe what you want to change in plain English
   - Example: "Change the footer copyright year to 2025"
   - Example: "Update the About Us section to say..."
5. v0 will make the changes and show you a preview
6. If it looks good, click **"Create PR"** (PR = Pull Request, a request to add changes)
7. The change will automatically deploy in a few minutes

💡 **Tip:** Be specific! Instead of "make it better," say exactly what you want changed.

### Option B: Edit Directly on GitHub (More Technical)

If you're comfortable with GitHub:

1. Go to **https://github.com/VicRobNes/v0-promoshop-inc-monday-apr-13**
2. Navigate to the file you need to change
3. Click the pencil icon to edit
4. Make your changes
5. Write a short description of what you changed
6. Click **"Commit changes"**
7. Vercel will automatically deploy the update

⚠️ **Warning:** Be careful editing code directly! A small typo can break things. Option A (v0) is safer.

---

## 10. How Changes Go Live

### Admin Panel Changes = Instant!

When you save something in the Admin Panel (product, brand, quote status, etc.):
- The change is saved to the database immediately
- Visitors will see the change right away (or after refreshing the page)

💡 **Tip:** After making a change, open the website in a new tab to verify it looks right!

### Code Changes = Takes 1-3 Minutes

When you make changes through v0 or GitHub:
1. Click **"Create PR"** or commit your changes
2. Vercel automatically starts building the new version
3. This takes about 1-3 minutes
4. Once complete, the new version is live

### How to Check Deployment Status

1. Go to **https://vercel.com**
2. Log in with your team account
3. Find the PromoShop project
4. Click **"Deployments"**
5. Look at the most recent deployment:
   - **Building** (yellow) = Still in progress
   - **Ready** (green) = Complete and live!
   - **Error** (red) = Something went wrong

If you see an error, don't panic! Contact your developer and share the error message.

---

## 11. One-Time Setup Guide (For Developer or Starting Over)

⚠️ **Note:** This section is for your developer or if you need to set up everything from scratch. Skip this unless that applies to you!

### Step 1: Supabase Setup (Database)

1. Go to **https://supabase.com** and create an account
2. Click **"New Project"**
3. Choose your organization or create one
4. Name your project (e.g., "promoshop-production")
5. Set a strong database password (save this somewhere safe!)
6. Select a region close to your visitors
7. Click **"Create new project"** and wait for it to provision

**Run the Database Schema:**
1. In Supabase, click **"SQL Editor"** in the sidebar
2. Click **"New query"**
3. Paste the schema SQL (your developer has this)
4. Click **"Run"**

**Get Your API Keys:**
1. Click **"Settings"** (gear icon) in Supabase
2. Click **"API"**
3. Under "Project API Keys" find:
   - **Project URL** — looks like `https://xxxxx.supabase.co`
   - **anon/public key** — a long string starting with `eyJ...`
4. Copy both — you'll need them for Vercel

### Step 2: Vercel Setup (Hosting)

1. Go to **https://vercel.com** and create an account
2. Connect your GitHub account when prompted
3. Click **"Add New Project"**
4. Import the repository: `VicRobNes/v0-promoshop-inc-monday-apr-13`
5. Before deploying, click **"Environment Variables"**
6. Add these two variables:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Project URL from Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon key from Supabase |

7. Click **"Deploy"**
8. Wait for the build to complete (2-5 minutes)

### Step 3: Create First Admin User

1. In Supabase, click **"Authentication"** in the sidebar
2. Click **"Users"**
3. Click **"Add User"**
4. Enter the admin's email and a temporary password
5. Click **"Create User"**
6. Copy the **User UID** (a long string like `a1b2c3d4-e5f6-...`)
7. Click **"Table Editor"** in the sidebar
8. Click the **"admin_users"** table
9. Click **"Insert row"**
10. Fill in:
    - `id` = paste the User UID you copied
    - `email` = the admin's email
    - `full_name` = their name
    - `role` = `admin`
    - `is_active` = `true`
11. Click **"Save"**

The admin can now log into `/admin` with their email and temporary password!

### Step 4: Add Content via Admin Panel

1. Log into the admin panel
2. Add your brands first (products need brands)
3. Add your products
4. Create hero slides for the homepage
5. Update settings as needed

---

## 12. Integrations & Pricing (2025)

Here's what each service costs:

### v0 (Website Builder)

| Plan | Price | Notes |
|------|-------|-------|
| Free | $0/month | Limited usage |
| Pro | ~$20/month | Recommended for regular updates |

### Vercel (Hosting)

| Plan | Price | Notes |
|------|-------|-------|
| Hobby | Free | For personal/testing only |
| Pro | $20/month per user | **Recommended for business** |

💡 **Tip:** Pro gives you better performance, more bandwidth, and team features.

### Supabase (Database)

| Plan | Price | What You Get |
|------|-------|--------------|
| Free | $0/month | 500MB database, 1GB storage |
| Pro | $25/month | 8GB database, 100GB storage |

⚠️ **Warning:** If you have lots of product images, you may need Pro for the extra storage.

### GitHub (Code Storage)

| Plan | Price |
|------|-------|
| Free | $0 |

GitHub is free for what we need!

### Custom Domain

Want your own domain like `promoshop.com`?

- **Cost:** ~$12-15/year
- **Where to buy:** GoDaddy, Namecheap, Google Domains

**To connect your domain:**
1. Purchase the domain from a registrar
2. In Vercel, go to your project > **Settings** > **Domains**
3. Click **"Add"** and enter your domain
4. Follow Vercel's instructions to update DNS at your registrar
5. Wait up to 48 hours for it to fully activate (usually faster)

### Email Notifications for Quotes

Want to receive an email when someone submits a quote request?

- **Service:** Resend.com
- **Cost:** Free up to 3,000 emails/month, then ~$20/month
- **Setup:** Developer needs to integrate this

Contact your developer if you want quote notification emails!

---

## 13. Troubleshooting

### "The site is showing an error!"

1. Go to **vercel.com** and log in
2. Open your project
3. Check the **Deployments** tab
4. If the latest deployment failed, click it to see the error
5. Check **Settings > Environment Variables** — make sure the Supabase keys are there
6. If you can't fix it, share the error with your developer

### "I can't log into the admin panel!"

1. Make sure you're using the correct email address
2. Try resetting your password:
   - In Supabase > Authentication > Users
   - Find your user and click the menu > "Send password reset"
3. Check that your email is in the `admin_users` table in Supabase
4. Make sure `is_active` is set to `true`

### "Images aren't showing on the website!"

1. Check if the storage bucket is set to "Public" in Supabase:
   - Supabase > Storage > click your bucket > Settings > make sure Public is enabled
2. Try re-uploading the image from the admin panel
3. Make sure the image file isn't corrupted (can you open it on your computer?)

### "I made a change in admin but it's not showing on the site!"

1. **Hard refresh your browser:**
   - Windows: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`
2. Try opening the site in an incognito/private window
3. Clear your browser cache
4. If still not working, check Supabase to confirm the data saved correctly

### "The Vercel deployment failed!"

1. Go to **vercel.com**
2. Open your project
3. Click **"Deployments"**
4. Click the failed deployment (red)
5. Read the error message
6. Take a screenshot and share it with your developer

💡 **Tip:** Don't panic about failed deployments! Your previous working version is still live until a new one succeeds.

---

## 14. Key Links

Bookmark these for quick access!

| What | Link |
|------|------|
| **Admin Panel** | `https://[your-domain]/admin` |
| **Supabase Dashboard** | https://supabase.com/dashboard/project/hnqgnfkzuvhnphzmxalf |
| **v0** | https://v0.dev (Nest Digital Solutions Inc team) |
| **Vercel** | https://vercel.com |
| **GitHub Repository** | https://github.com/VicRobNes/v0-promoshop-inc-monday-apr-13 |

---

## Need Help?

If you're stuck on something not covered in this guide:

1. **Check this guide again** — the answer might be here!
2. **Ask v0** — describe your problem in the chat at v0.dev
3. **Contact your developer** — for technical issues beyond the admin panel

---

**You've got this, Abigail!** 🎉

Remember: The admin panel is your friend. Most day-to-day tasks happen there. Don't be afraid to click around and explore — you can't break anything by just looking!

*Last updated: April 2025*
