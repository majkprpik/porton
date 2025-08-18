-- Get house_type_ids into variables
DO $$
DECLARE
    family1_id INT;
    family2_id INT;
    couple_id INT;
    mobilne_id INT;
BEGIN
    SELECT house_type_id INTO family1_id FROM porton.house_types WHERE house_type_name = 'family 1';
    SELECT house_type_id INTO family2_id FROM porton.house_types WHERE house_type_name = 'family 2';
    SELECT house_type_id INTO couple_id FROM porton.house_types WHERE house_type_name = 'couple';
    SELECT house_type_id INTO mobilne_id FROM porton.house_types WHERE house_type_name = 'mobilne';

    -- Insert first 20 (family 1)
    FOR i IN 1..20 LOOP
        INSERT INTO porton.temp_houses (house_number, house_name, house_type_id)
        VALUES (0, '0', family1_id);
    END LOOP;

    -- Insert next 20 (family 2)
    FOR i IN 1..20 LOOP
        INSERT INTO porton.temp_houses (house_number, house_name, house_type_id)
        VALUES (0, '0', family2_id);
    END LOOP;

    -- Insert next 20 (couple)
    FOR i IN 1..20 LOOP
        INSERT INTO porton.temp_houses (house_number, house_name, house_type_id)
        VALUES (0, '0', couple_id);
    END LOOP;

    -- Insert next 20 (mobilne)
    FOR i IN 1..20 LOOP
        INSERT INTO porton.temp_houses (house_number, house_name, house_type_id)
        VALUES (0, '0', mobilne_id);
    END LOOP;
END $$;