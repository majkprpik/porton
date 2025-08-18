DO $$
DECLARE
    i INT := 1;
    rec RECORD;
BEGIN
    FOR rec IN
        SELECT house_id FROM porton.temp_houses 
        WHERE house_number = 0 AND house_name = '0'
        ORDER BY house_id ASC
    LOOP
        UPDATE porton.temp_houses
        SET house_id = -i
        WHERE house_id = rec.house_id;

        i := i + 1;
    END LOOP;
END $$;