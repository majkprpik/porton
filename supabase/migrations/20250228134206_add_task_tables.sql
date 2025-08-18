create table if not exists porton.task_types (
    task_type_id serial primary key,
    task_type_name text not null
);

create table if not exists porton.task_progress_types (
    task_progress_type_id serial primary key,
    task_progress_type_name text not null
);

create table if not exists porton.tasks (
    task_id serial primary key,
    task_type_id INT NOT NULL REFERENCES porton.task_types(task_type_id),
    task_progress_type_id INT NOT NULL REFERENCES porton.task_progress_types(task_progress_type_id),
    house_id INT NOT NULL REFERENCES porton.houses(house_id),
    start_time timestamp with time zone,
    end_time timestamp with time zone
);