-- Make note column nullable in house_availabilities table
ALTER TABLE porton.house_availabilities
ALTER COLUMN note DROP NOT NULL,
ALTER COLUMN note DROP DEFAULT;

-- Update comment to reflect that note is now nullable
COMMENT ON COLUMN porton.house_availabilities.note IS 'Optional note for reservation slots';
