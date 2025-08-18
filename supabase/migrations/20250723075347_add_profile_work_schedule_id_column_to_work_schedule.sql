-- Add the new column
ALTER TABLE porton.profile_work_days
ADD COLUMN IF NOT EXISTS profile_work_schedule_id integer;

ALTER TABLE porton.profile_work_days
ADD CONSTRAINT fk_profile_work_schedule
FOREIGN KEY (profile_work_schedule_id)
REFERENCES porton.profile_work_schedule(id)
ON DELETE CASCADE;