ALTER TABLE porton.notes
ADD COLUMN id UUID DEFAULT gen_random_uuid();

ALTER TABLE porton.notes
ADD PRIMARY KEY (id);
