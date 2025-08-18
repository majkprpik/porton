CREATE OR REPLACE FUNCTION replace_profile_references()
RETURNS TRIGGER AS $$
DECLARE
    deleted_user_id UUID;
BEGIN
    -- Get the 'Deleted User' ID (replace with your actual logic if needed)
    SELECT id INTO deleted_user_id
    FROM porton.profiles
    WHERE id = '11111111-1111-1111-1111-111111111111';

    -- Check if Deleted User exists
    IF deleted_user_id IS NULL THEN
        RAISE EXCEPTION 'Deleted User profile not found';
    END IF;

    IF OLD.id = deleted_user_id THEN
        RAISE EXCEPTION 'You cannot delete the Deleted User profile';
    END IF;

    -- Update all referencing tables
    UPDATE porton.notes SET profile_id = deleted_user_id WHERE profile_id = OLD.id;
    UPDATE porton.tasks SET created_by = deleted_user_id WHERE created_by = OLD.id;
    UPDATE porton.repair_task_comments SET user_id = deleted_user_id WHERE user_id = OLD.id;

    RETURN OLD; -- Allow the delete to continue
END;
$$ LANGUAGE plpgsql;

-- Drop the old trigger if it exists
DROP TRIGGER IF EXISTS replace_profile_references_trigger ON porton.profiles;

-- Create the new trigger
CREATE TRIGGER replace_profile_references_trigger
BEFORE DELETE ON porton.profiles
FOR EACH ROW
EXECUTE FUNCTION replace_profile_references();