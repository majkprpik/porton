CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

ALTER TABLE porton.profiles
ALTER COLUMN id SET DEFAULT uuid_generate_v4();