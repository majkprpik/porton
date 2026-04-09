CREATE OR REPLACE FUNCTION porton.cleanup_old_work_groups(
  p_older_than INTERVAL DEFAULT INTERVAL '2 days'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = porton, public
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  WITH candidate_work_groups AS (
    SELECT wg.work_group_id
    FROM porton.work_groups wg
    WHERE COALESCE(wg.is_repair, FALSE) = FALSE
      AND wg.created_at < NOW() - p_older_than
      AND NOT EXISTS (
        SELECT 1
        FROM porton.work_group_tasks wgt
        LEFT JOIN porton.tasks t
          ON t.task_id = wgt.task_id
        LEFT JOIN porton.task_types tt
          ON tt.task_type_id = t.task_type_id
        LEFT JOIN porton.task_progress_types tpt
          ON tpt.task_progress_type_id = t.task_progress_type_id
        WHERE wgt.work_group_id = wg.work_group_id
          AND NOT (
            (
              COALESCE(tt.task_type_name, '') = U&'\010Ci\0161\0107enje ku\0107ice'
              AND COALESCE(tpt.task_progress_type_name, '') = U&'Potvr\0111eno'
            )
            OR (
              COALESCE(tt.task_type_name, '') <> U&'\010Ci\0161\0107enje ku\0107ice'
              AND COALESCE(tpt.task_progress_type_name, '') = U&'Zavr\0161eno'
            )
          )
      )
  ),
  deleted_work_group_profiles AS (
    DELETE FROM porton.work_group_profiles wgp
    USING candidate_work_groups cwg
    WHERE wgp.work_group_id = cwg.work_group_id
  ),
  deleted_work_group_tasks AS (
    DELETE FROM porton.work_group_tasks wgt
    USING candidate_work_groups cwg
    WHERE wgt.work_group_id = cwg.work_group_id
  ),
  deleted_work_groups AS (
    DELETE FROM porton.work_groups wg
    USING candidate_work_groups cwg
    WHERE wg.work_group_id = cwg.work_group_id
    RETURNING wg.work_group_id
  )
  SELECT COUNT(*)
  INTO v_deleted_count
  FROM deleted_work_groups;

  RETURN COALESCE(v_deleted_count, 0);
END;
$$;

REVOKE ALL ON FUNCTION porton.cleanup_old_work_groups(INTERVAL) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION porton.cleanup_old_work_groups(INTERVAL) TO service_role;
