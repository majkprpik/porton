create table if not exists porton.shift_types(
  id serial primary key,
  name TEXT NOT NULL UNIQUE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL
);

INSERT INTO porton.shift_types (name, start_time, end_time) VALUES
  ('morning', '06:00', '14:00'),
  ('afternoon', '14:00', '22:00'),
  ('evening', '22:00', '06:00');

create table if not exists porton.profile_work_schedule(
  id serial primary key,
  profile_id uuid NOT NULL REFERENCES porton.profiles(id),
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  shift_type_id integer NOT NULL REFERENCES porton.shift_types(id)
);