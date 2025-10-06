ALTER TABLE porton.houses
ADD COLUMN has_pool boolean DEFAULT false;

UPDATE porton.houses
SET has_pool = true
WHERE house_number IN (630, 631, 632, 638);