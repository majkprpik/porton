-- Step 1: Add new location_type column with default 'house' for existing records
ALTER TABLE porton.tasks
ADD COLUMN location_type VARCHAR(20) NOT NULL DEFAULT 'house';

-- Step 2: Make house_id column nullable
ALTER TABLE porton.tasks
ALTER COLUMN house_id DROP NOT NULL;

-- Step 3: Update existing records to ensure consistency
UPDATE porton.tasks
SET location_type = 'house'
WHERE house_id IS NOT NULL;

-- Step 4: Add a comment to the table to explain the location_type options
COMMENT ON COLUMN porton.tasks.location_type IS 'Type of location: "house", "building", or "parcel"';

-- Optional: Create an index on location_type for faster queries
CREATE INDEX idx_tasks_location_type ON porton.tasks(location_type);