ALTER TABLE porton.profile_work_schedule
DROP CONSTRAINT profile_work_schedule_profile_id_fkey,
ADD CONSTRAINT profile_work_schedule_profile_id_fkey
  FOREIGN KEY (profile_id) REFERENCES porton.profiles(id)
  ON DELETE CASCADE;

ALTER TABLE porton.profile_work_days
DROP CONSTRAINT profile_work_days_profile_id_fkey,
ADD CONSTRAINT profile_work_days_profile_id_fkey
  FOREIGN KEY (profile_id) REFERENCES porton.profiles(id)
  ON DELETE CASCADE;