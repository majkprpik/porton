ALTER TABLE porton.houses
ADD COLUMN is_active boolean DEFAULT true;

UPDATE porton.houses
SET is_active = false
WHERE is_deleted = true;

ALTER TABLE porton.houses
ADD COLUMN description text;

