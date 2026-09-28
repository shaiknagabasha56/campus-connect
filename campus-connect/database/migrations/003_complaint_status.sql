-- Complaint statuses.
--
-- The app saves these values: new, under-review, in-progress, resolved, rejected.
-- Older rows in some databases still use: pending, accessed, solved.
-- If changing a complaint's status fails in the admin inbox, the complaints.status
-- column is probably an ENUM (or a short VARCHAR) that does not allow the new values.
-- Run this once. It keeps all existing data.

-- 1) let the column hold any of the values above
ALTER TABLE complaints
    MODIFY status VARCHAR(30) NOT NULL DEFAULT 'new';

-- 2) (optional) bring old rows onto the new names
UPDATE complaints SET status = 'new'          WHERE status = 'pending';
UPDATE complaints SET status = 'under-review' WHERE status = 'accessed';
UPDATE complaints SET status = 'resolved'     WHERE status = 'solved';

-- ---------------------------------------------------------------------------
-- Which page does each complaint belong to?  (organization_id NULL = filed on the
-- main Complaints page; a page's admin inbox only shows rows with ITS organization_id)
--
-- SELECT c.reference_id, c.title, c.category, c.organization_id, o.slug AS filed_on
-- FROM complaints c LEFT JOIN organizations o ON o.id = c.organization_id
-- ORDER BY c.id DESC;
--
-- Move a stray complaint back to the main Complaints page (replace the reference):
-- UPDATE complaints SET organization_id = NULL WHERE reference_id = 'CMP-XXXXXXXX';
