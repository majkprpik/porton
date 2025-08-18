-- Add arrival_time and departure_time columns to house_availabilities table
ALTER TABLE porton.house_availabilities
ADD COLUMN arrival_time time NOT NULL DEFAULT '15:00:00',
ADD COLUMN departure_time time NOT NULL DEFAULT '10:00:00';

-- Add comment to the columns
COMMENT ON COLUMN porton.house_availabilities.arrival_time IS 'Time of day when guests are expected to arrive, default is 15:00 (3:00 PM)';
COMMENT ON COLUMN porton.house_availabilities.departure_time IS 'Time of day when guests are expected to depart, default is 10:00 AM';
