create table if not exists porton.notes(
    profile_id uuid NOT NULL REFERENCES porton.profiles(id),
    note text,
    time_sent TIMESTAMP DEFAULT NOW()
);