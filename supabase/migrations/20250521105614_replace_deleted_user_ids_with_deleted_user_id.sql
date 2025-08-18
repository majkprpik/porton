

CREATE OR REPLACE FUNCTION replace_profile_references()
RETURNS TRIGGER AS $$
DECLARE
    deleted_user_id UUID := '11111111-1111-1111-1111-111111111111';
    rec RECORD;
BEGIN
    -- Loop through all foreign key constraints referencing the 'profiles' table in the 'porton' schema
    FOR rec IN
        SELECT
            tc.table_schema,
            tc.table_name,
            kcu.column_name
        FROM
            information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.constraint_schema = kcu.constraint_schema
        WHERE
            tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = 'porton'
            AND kcu.referenced_table_name = 'profiles'
            AND kcu.referenced_table_schema = 'porton'
    LOOP
        EXECUTE format(
            'UPDATE %I.%I SET %I = $1 WHERE %I = $2',
            rec.table_schema,
            rec.table_name,
            rec.column_name,
            rec.column_name
        )
        USING deleted_user_id, OLD.id;
    END LOOP;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS replace_profile_references_trigger ON porton.profiles;

CREATE TRIGGER replace_profile_references_trigger
BEFORE DELETE ON porton.profiles
FOR EACH ROW
EXECUTE FUNCTION replace_profile_references();