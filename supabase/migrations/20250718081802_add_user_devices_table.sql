create table if not exists porton.user_devices(
  id serial primary key,
  profile_id uuid NOT NULL REFERENCES porton.profiles(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  fcm_token TEXT NOT NULL,
  device_info TEXT,
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile_id, device_id)
);