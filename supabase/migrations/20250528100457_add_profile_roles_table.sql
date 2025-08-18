CREATE TABLE IF NOT EXISTS porton.profile_roles (
    id serial PRIMARY KEY,
    name text NOT NULL
);

INSERT INTO porton.profile_roles (
    name
)
VALUES
    ('Uprava'),
    ('Savjetnik uprave'),
    ('Voditelj recepcije'),
    ('Recepcija'),
    ('Voditelj kampa'),
    ('Voditelj domacinstva'),
    ('Sobarica'),
    ('Odrzavanje'),
    ('Prodaja'),
    ('Terasar'),
    ('Kucni majstor'),
    ('Nocna recepcija'),
    ('Korisnicka sluzba'),
    ('Ostalo');

ALTER TABLE porton.profiles ADD COLUMN role_id INT;

UPDATE porton.profiles SET role_id = (
    SELECT id FROM porton.profile_roles WHERE name = 'Uprava'
) WHERE role = 'manager';

UPDATE porton.profiles SET role_id = (
    SELECT id FROM porton.profile_roles WHERE name = 'Savjetnik uprave'
) WHERE role = 'savjetnik_uprave';

UPDATE porton.profiles SET role_id = (
    SELECT id FROM porton.profile_roles WHERE name = 'Voditelj recepcije'
) WHERE role = 'voditelj_recepcije';

UPDATE porton.profiles SET role_id = (
    SELECT id FROM porton.profile_roles WHERE name = 'Recepcija'
) WHERE role = 'recepcija';

UPDATE porton.profiles SET role_id = (
    SELECT id FROM porton.profile_roles WHERE name = 'Voditelj kampa'
) WHERE role = 'voditelj_kampa';

UPDATE porton.profiles SET role_id = (
    SELECT id FROM porton.profile_roles WHERE name = 'Voditelj domacinstva'
) WHERE role = 'voditelj_domacinstva';

UPDATE porton.profiles SET role_id = (
    SELECT id FROM porton.profile_roles WHERE name = 'Sobarica'
) WHERE role = 'sobarica';

UPDATE porton.profiles SET role_id = (
    SELECT id FROM porton.profile_roles WHERE name = 'Odrzavanje'
) WHERE role = 'odrzavanje';

UPDATE porton.profiles SET role_id = (
    SELECT id FROM porton.profile_roles WHERE name = 'Prodaja'
) WHERE role = 'prodaja';

UPDATE porton.profiles SET role_id = (
    SELECT id FROM porton.profile_roles WHERE name = 'Terasar'
) WHERE role = 'terase';

UPDATE porton.profiles SET role_id = (
    SELECT id FROM porton.profile_roles WHERE name = 'Kucni majstor'
) WHERE role = 'kucni_majstor';

UPDATE porton.profiles SET role_id = (
    SELECT id FROM porton.profile_roles WHERE name = 'Nocna recepcija'
) WHERE role = 'nocni_recepcioner';

UPDATE porton.profiles SET role_id = (
    SELECT id FROM porton.profile_roles WHERE name = 'Korisnicka sluzba'
) WHERE role = 'customer_service';

UPDATE porton.profiles SET role_id = (
    SELECT id FROM porton.profile_roles WHERE name = 'Ostalo'
) WHERE role_id IS NULL;

ALTER TABLE porton.profiles
ADD CONSTRAINT fk_profile_role
FOREIGN KEY (role_id)
REFERENCES porton.profile_roles(id)
ON DELETE SET NULL;

ALTER TABLE porton.profiles DROP COLUMN role;

