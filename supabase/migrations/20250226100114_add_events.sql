create table if not exists event_types (
  event_type_id uuid primary key default gen_random_uuid(),
  event_type_name text not null
);

create table if not exists events (
    event_id uuid primary key default gen_random_uuid(),
    event_name text not null,
    venue_status_id uuid not null references venue_statuses(venue_status_id)
);

create table if not exists event_groups (
    event_group_id uuid primary key default gen_random_uuid(),
    event_id uuid not null references events(event_id) on delete cascade,
    user_id uuid not null references users(user_id) on delete cascade,
    unique(event_id, user_id)
);