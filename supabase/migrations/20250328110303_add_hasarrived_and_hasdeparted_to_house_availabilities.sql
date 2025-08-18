ALTER TABLE IF EXISTS porton.house_availabilities
ADD COLUMN IF NOT EXISTS has_arrived boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_departed boolean DEFAULT false;