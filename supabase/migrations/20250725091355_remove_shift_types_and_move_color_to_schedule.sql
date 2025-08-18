-- drop shift types 
ALTER TABLE porton.profile_work_schedule
DROP CONSTRAINT IF EXISTS profile_work_schedule_shift_type_id_fkey;

ALTER TABLE porton.profile_work_schedule
DROP COLUMN IF EXISTS shift_type_id;

DROP TABLE IF EXISTS porton.shift_types;

--drop color from work days
ALTER TABLE porton.profile_work_days
DROP COLUMN IF EXISTS color;

--add color to schedule
ALTER TABLE porton.profile_work_schedule
ADD COLUMN color TEXT;