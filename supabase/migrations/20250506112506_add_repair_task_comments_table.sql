CREATE TABLE if not exists porton.repair_task_comments(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id INTEGER NOT NULL,
    user_id UUID NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_task
        FOREIGN KEY (task_id)
        REFERENCES porton.tasks(task_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_user
        FOREIGN KEY (user_id)
        REFERENCES porton.profiles(id)
        ON DELETE CASCADE
);