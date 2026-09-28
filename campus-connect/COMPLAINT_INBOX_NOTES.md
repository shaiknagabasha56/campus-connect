# Complaint inbox fixes (all clubs, cells, departments and offices - shared files)

- static/js/club_admin_submissions.js: real error text (was always "Could not load the inbox."),
  old status names shown properly (accessed = under review, solved = resolved), heading style fixed on
  department/cell/office pages, counters refresh one after another.
- routes/complaints.py + database/queries.py: the status update now always answers with a clear message;
  if the database refuses the new status it says so (HTTP 500) instead of failing silently.
- database/migrations/003_complaint_status.sql: OPTIONAL - run it if changing a status fails.
  It also contains a query to see which page each complaint belongs to.
