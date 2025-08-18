ALTER TABLE porton.tasks
ADD COLUMN description TEXT;

-- Comment on the column to provide documentation
COMMENT ON COLUMN porton.tasks.description IS 'Detailed description of the task'; 