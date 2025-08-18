-- Add the created_by column
ALTER TABLE porton.tasks
ADD COLUMN created_by UUID;

-- Add the created_at column with a default value of the current timestamp
ALTER TABLE porton.tasks
ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add the foreign key constraint to link created_by to the profiles table
ALTER TABLE porton.tasks
ADD CONSTRAINT fk_tasks_created_by
FOREIGN KEY (created_by)
REFERENCES porton.profiles (id); -- Assuming the primary key in profiles is named 'id'