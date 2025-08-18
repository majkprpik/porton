alter table if exists porton.tasks
add column if not exists can_complete boolean default true;