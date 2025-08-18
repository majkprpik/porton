DROP VIEW IF EXISTS house_statuses_view;
DROP VIEW IF EXISTS house_status2;

ALTER TABLE porton.house_availabilities
DROP CONSTRAINT IF EXISTS house_availabilities_house_availability_type_id_fkey;

ALTER TABLE porton.house_availabilities
DROP COLUMN IF EXISTS house_availability_type_id CASCADE;

DROP TABLE IF EXISTS porton.house_availability_types CASCADE;
