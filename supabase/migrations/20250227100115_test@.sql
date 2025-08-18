create table if not exists test2 (
    test_id uuid primary key default gen_random_uuid(),
    test_name text not null
);