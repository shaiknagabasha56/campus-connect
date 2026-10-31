# Campus Connect fixes: updates attachments + category-page complaints

## What changed

1. Public category-page complaint forms now submit to `POST /category-complaints/submit`.
2. The new route stores records in `organization_page_complaints` only.
3. Organization admins load their own records from `GET /category-complaints/admin/list`. The server scopes the query using the logged-in admin's `session.organization_id`.
4. The category complaint admin view is read-only. It has no progress/status update workflow.
5. The existing general complaints routes, JavaScript, and `complaints` table are not used by this new category-page flow.
6. The first successful database connection performs additive schema setup for `updates.attachment_url`, `updates.attachment_name`, `updates.attachment_mime`, and creates `organization_page_complaints`. It does not alter the existing general `complaints` table.

## Setup

- Use this `campus-connect` folder in place of the previous fixed folder, keeping your local `.env` file (do not overwrite it with `.env.example`).
- Ensure the MySQL user configured in `.env` has `ALTER` permission on `updates` and `CREATE` permission in the selected database. If not, run `migrations/20261031_updates_attachments_and_category_complaints.sql` in MySQL Workbench after selecting the same database as `DB_NAME` in `.env`.
- Restart Flask after the migration.
- Hard-refresh the browser with Ctrl+Shift+R.

## Verification

- `GET /updates/organization/cse` and `GET /updates/public/category/academic` should return 200 and include existing published updates.
- Submit a complaint from the CSE page. It should create a row in `organization_page_complaints` with the CSE `organization_id`.
- Log in as CSE admin and open Complaints. Only CSE records should appear.
- Log in as AWS admin and open Complaints. Only AWS records should appear.
- The existing general Complaints section continues to use `/complaints/*` and the existing `complaints` table.
