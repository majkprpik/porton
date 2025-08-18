ALTER TABLE events ADD COLUMN is_locked boolean default false;
ALTER TABLE venue_statuses ADD COLUMN comment text;