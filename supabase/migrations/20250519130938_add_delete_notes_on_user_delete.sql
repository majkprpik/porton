ALTER TABLE porton.notes
DROP CONSTRAINT notes_profile_id_fkey,
ADD CONSTRAINT notes_profile_id_fkey
FOREIGN KEY (profile_id) REFERENCES profiles(id)
ON DELETE CASCADE;