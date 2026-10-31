# Campus Connect — Cloudinary image migration

This migration keeps the existing page structure, CSS dimensions, and visual design. It moves raster photographs, banners, and illustrations to Cloudinary while leaving SVG placeholders and small UI icons local.

## What is already wired into the application

- Announcement image uploads use the existing Flask Cloudinary upload flow.
- Announcement API responses now use Cloudinary `f_auto,q_auto` delivery transformations.
- New uploads continue to store the original secure Cloudinary URL in MySQL; optimized delivery URLs are returned to the browser.
- Existing image layout and CSS are not redesigned.

## One-time migration of existing assets

The ZIP cannot upload files into your Cloudinary account until your account credentials are supplied. Add these values to your existing `.env` file (do not commit `.env`):

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Ensure your database variables are also configured in `.env`, then from the `campus-connect` project root run:

```bash
python scripts/migrate_images_to_cloudinary.py
```

The script:
1. Uploads raster assets referenced by the application from `static/images/`, plus legacy files from `static/uploads/updates/`, to stable Cloudinary public IDs.
2. Imports referenced Unsplash photographs into your Cloudinary account.
3. Rewrites image references in HTML, CSS, JavaScript, and Python source files to optimized Cloudinary URLs.
4. Updates matching legacy announcement image paths in the `updates.cover_image` MySQL column.
5. Writes `cloudinary-image-manifest.json` as a record of migrated URLs.

SVG files (such as `hod.svg` and the club/cell head placeholders) remain local by design. Small UI icons remain local. `rgukt.png` is a raster logo and is migrated with the other raster images.

## Safe rollout

- Back up your project and database before running the migration.
- Run it once locally with the same `.env` database and Cloudinary account used by the deployed app.
- Check the generated manifest and test homepage, academic, non-academic, clubs, cells, and announcement detail pages.
- Commit/push the rewritten source files and manifest after verification.
- Keep the local original assets until the deployed site has been checked. The migration script intentionally does not delete them.

## Admin announcement uploads

All organization announcement forms submit to the shared `/updates` endpoints. New cover images are uploaded to Cloudinary automatically by Flask; no admin needs to upload manually in the Cloudinary dashboard. Replacing an announcement image uploads the new file and removes the old Cloudinary image only after the database update succeeds.
