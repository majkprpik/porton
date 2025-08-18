ALTER TABLE porton.house_availabilities
ADD COLUMN house_number INT4;

UPDATE porton.house_availabilities
SET house_number = houses.house_number
FROM porton.houses
WHERE porton.house_availabilities.house_id = porton.houses.house_id;