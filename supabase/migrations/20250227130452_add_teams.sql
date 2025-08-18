create table if not exists events (
    event_id uuid primary key default gen_random_uuid(),
    date timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists event_user (
    profile_id uuid not null references profiles(id),
    event_id uuid not null references events(event_id),
    primary key (profile_id, event_id)
);