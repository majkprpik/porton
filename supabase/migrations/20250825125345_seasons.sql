create table if not exists porton.seasons (
    id serial primary key,
    year int not null unique,
    season_start_date date not null,
    season_end_date date not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
