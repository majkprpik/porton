create table if not exists venue_types (
  venue_types_id uuid primary key default gen_random_uuid(),
  venue_type_name text not null
);

create table if not exists venues (
    venue_id uuid primary key default gen_random_uuid(),
    venue_name text not null,
    venue_types_id uuid not null references venue_types(venue_types_id)
);

create table if not exists venue_status_types (
    venue_status_type_id uuid primary key default gen_random_uuid(),
    venue_status_type_name text not null
);

create table if not exists venue_status_states (
    venue_status_state_id uuid primary key default gen_random_uuid(),
    venue_status_state_name text not null
);

create table if not exists venue_statuses (
    venue_status_id uuid primary key default gen_random_uuid(),
    venue_status_type_id uuid not null references venue_status_types(venue_status_type_id),
    venue_id uuid not null references venues(venue_id),
    venue_status_state_id uuid references venue_status_states(venue_status_state_id),
    start_date timestamptz,
    end_date timestamptz
);
