-- Update default arrival time to 16:00 (4:00 PM)
ALTER TABLE porton.house_availabilities
ALTER COLUMN arrival_time SET DEFAULT '16:00:00';

-- Update the column comment to match the new default
COMMENT ON COLUMN porton.house_availabilities.arrival_time IS 'Time of day when guests are expected to arrive, default is 16:00 (4:00 PM)';
