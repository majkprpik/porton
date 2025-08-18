DELETE FROM porton.tasks
WHERE task_type_id = (
  SELECT task_type_id FROM porton.task_types WHERE task_type_name = 'Punjenje'
);

DELETE FROM porton.task_types
WHERE task_type_name = 'Punjenje';