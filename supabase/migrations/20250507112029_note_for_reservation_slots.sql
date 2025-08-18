-- Add arrival_time and departure_time columns to house_availabilities table
ALTER TABLE porton.house_availabilities
ADD COLUMN note TEXT NOT NULL DEFAULT 'Nema napomene';

-- Add comment to the columns
COMMENT ON COLUMN porton.house_availabilities.note IS 'Note for reservation slots, default is Nema napomene';
