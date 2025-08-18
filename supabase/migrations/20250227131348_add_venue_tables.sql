create table if not exists venue_event (
    venue_id uuid not null references venues(venue_id),
    event_id uuid not null references events(event_id),
    primary key (event_id, venue_id)
);

create table if not exists venue_status_types (
  venue_status_type_id uuid primary key default gen_random_uuid(),
  venue_status_type_name text not null
);

create table if not exists venue_status_progress_types (
  venue_status_progress_type_id uuid primary key default gen_random_uuid(),
  venue_status_progress_type_name text not null
);

create table if not exists venue_statuses (
  venue_status_id uuid primary key default gen_random_uuid(),
  venue_status_type_id uuid not null references venue_status_types(venue_status_type_id),
  venue_status_progress_type_id uuid not null references venue_status_progress_types(venue_status_progress_type_id),
  start_time timestamp with time zone,
  end_time timestamp with time zone
);