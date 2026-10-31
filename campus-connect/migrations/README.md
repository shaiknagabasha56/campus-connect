# Database migrations

For the multi-format updates and the independent category-page complaint inbox, run:

`20261031_updates_attachments_and_category_complaints.sql`

Select the same database configured by `DB_NAME` in the project's `.env` before running it.

This migration adds attachment columns to `updates` and creates the separate
`organization_page_complaints` table. It does **not** alter, read, or write the
existing general `complaints` table. The application also performs these additive
checks automatically on its first database connection, provided the configured
MySQL user has `ALTER` and `CREATE` privileges.
