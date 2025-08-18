create table if not exists porton.work_group_tasks (
    work_group_id INT NOT NULL REFERENCES porton.work_groups(work_group_id),
    task_id INT NOT NULL REFERENCES porton.tasks(task_id),
    primary key (work_group_id, task_id)
);