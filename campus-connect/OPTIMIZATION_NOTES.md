# Campus Connect — safe optimization package

## Scope and compatibility

This package is based on the supplied project. Changes were intentionally kept conservative to avoid altering existing workflows or page design.

### Changes made
- Compressed large JPEG/JPEG-format raster assets in place while preserving their filenames and dimensions. The largest images are substantially smaller, reducing initial transfer size without requiring template URL changes.
- Ensured the shared `static/css/mobile.css` stylesheet is included in templates that previously omitted it, extending the existing mobile layout layer to more pages.
- Added navbar-only CSS rules to hide the calendar and search controls requested for removal. The underlying elements and scripts remain in place to avoid null-reference errors in existing page JavaScript.
- Corrected the Radio/Emergency admin account email addresses printed at the end of `setup_module_admins.py` so they match the accounts that script actually creates.
- Removed local virtual environments, Python bytecode caches, Git metadata, local `.env`, and root certificate copies from the distributable archive. These are not required in a deployment ZIP and the `.env` can contain secrets.

### Important limitations
- Cloudinary uploads cannot be performed from this package because no Cloudinary account access was supplied. `CLOUDINARY_MIGRATION.md` lists which images to upload and a safe migration process. Existing local image paths remain in place so the UI does not break.
- Admin accounts are database-backed. No passwords have been hardcoded into the source. Use `setup_module_admins.py` to set the dedicated Radio and Emergency admin passwords interactively. Existing organization admins still depend on their database records and organization assignments.
- Emergency and complaint flows depend on the live MySQL schema, environment configuration, and browser/API integration. Do not treat them as fully verified from a source-only package; follow the verification checklist below against a staging deployment before replacing the live app.
- Breadcrumbs were not added in this conservative pass because adding them across every page would change page markup/layout, conflicting with the strict no-UI-change constraint.

## Deployment
1. Extract this ZIP.
2. Create a Python virtual environment and install `requirements.txt`.
3. Copy `.env.example` to `.env` and fill in the actual values privately. Never commit `.env`.
4. Ensure Render environment variables match the existing production configuration.
5. Deploy to a staging service first if available. Keep the current live deployment until checks pass.

## Checks to run before replacing production
- Sign up, email verification, login/logout, forgot/reset password, and Google OAuth callback.
- Open homepage and all academic, non-academic, clubs, cells, and announcement pages.
- Confirm each admin role sees only its own dashboard and cannot access another admin's routes.
- Submit a complaint with and without an attachment; verify it appears in the admin dashboard and status changes persist.
- Test the emergency page and emergency admin actions on mobile and desktop.
- Test radio playback, LiveKit commentary, admin upload, and logout.
- Check Render logs for database, email, OAuth, Cloudinary, and LiveKit errors.
