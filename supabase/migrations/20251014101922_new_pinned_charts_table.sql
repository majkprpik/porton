create table if not exists porton.pinned_charts (
    id serial primary key,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    charts TEXT[] NOT NULL
);