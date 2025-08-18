-- Add new columns to house_availabilities table
ALTER TABLE porton.house_availabilities
ADD COLUMN last_name text,
ADD COLUMN reservation_number text,
ADD COLUMN reservation_length integer,
ADD COLUMN prev_connected boolean DEFAULT false,
ADD COLUMN next_connected boolean DEFAULT false,
ADD COLUMN adults integer DEFAULT 0,
ADD COLUMN babies integer DEFAULT 0,
ADD COLUMN cribs integer DEFAULT 0,
ADD COLUMN dogs_d integer DEFAULT 0,
ADD COLUMN dogs_s integer DEFAULT 0,
ADD COLUMN dogs_b integer DEFAULT 0,
ADD COLUMN color_theme integer DEFAULT 0,
ADD COLUMN color_tint decimal DEFAULT 0.0; 