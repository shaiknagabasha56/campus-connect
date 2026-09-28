# Cells, departments and offices now behave like the club pages

New:  static/js/section_public_forms.js
      - complaint form (all 19 pages) -> POST /complaints/submit
      - join form (cells) -> POST /complaints/club-submissions/members
      - "Apply Now" on an announcement -> in-site application form -> POST /complaints/club-submissions/applications
      (before this, these forms only showed a demo "Submitted successfully" message and threw the data away)
Edited:
  - 19 admin pages (cells, academic, non-academic): now load club_admin_submissions.js, so the Complaints /
    Applications / Members inbox shows real student submissions and lets the admin change their status.
  - static/js/club_admin_submissions.js: the counters (badges + "3 Complaints" pills) show real numbers of
    open items instead of the fixed 3 / 4 / 5; wording fits club / cell / department / office;
    no more console error when a card is clicked.
  - static/js/club_public_data.js: the club Join / Complaint / Application popups now close by themselves after success.
  - Club and cell admin pages showed Artix's description ("Fine arts & design club...") - each now shows its own.
Announcements (admin adds -> student receives) already worked on all these pages; no change needed.
