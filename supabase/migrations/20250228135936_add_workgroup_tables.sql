create table if not exists porton.work_groups (
    work_group_id serial primary key,
    created_at timestamp with time zone default now(),
    is_locked boolean default false
);

create table if not exists porton.work_group_profiles (
    work_group_id INT NOT NULL REFERENCES porton.work_groups(work_group_id),
    profile_id uuid NOT NULL REFERENCES porton.profiles(id),
    primary key (work_group_id, profile_id)
);

create table if not exists porton.work_group_houses (
    work_group_id INT NOT NULL REFERENCES porton.work_groups(work_group_id),
    house_id INT NOT NULL REFERENCES porton.houses(house_id),
    primary key (work_group_id, house_id)
);