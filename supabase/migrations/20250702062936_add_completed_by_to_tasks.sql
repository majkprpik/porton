ALTER TABLE porton.tasks
ADD COLUMN completed_by UUID REFERENCES porton.profiles(id);