-- Track when a prospect/client was first opened in the CRM. Drives a "New" badge
-- in the Prospects list that stays until the record is opened, then clears.
-- New rows default to NULL (unseen = New); the detail page stamps opened_at on
-- first view.
alter table clients add column if not exists opened_at timestamptz;
