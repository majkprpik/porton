ALTER TABLE porton.houses
  ADD COLUMN IF NOT EXISTS has_jacuzzi boolean NOT NULL DEFAULT false;
