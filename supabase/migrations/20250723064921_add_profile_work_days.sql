create table if not exists porton.profile_work_days(
  id serial primary key,
  profile_id uuid NOT NULL REFERENCES porton.profiles(id),
  day DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  color TEXT
);