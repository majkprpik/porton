DROP VIEW IF EXISTS porton.house_statuses_view;

CREATE VIEW porton.house_statuses_view AS
WITH latest_availability AS (
    SELECT DISTINCT ON (ha.house_id) ha.house_id,
        ha.house_availability_type_id,
        ha.house_availability_start_date,
        ha.house_availability_end_date,
        hat.house_availability_type_name
    FROM (porton.house_availabilities ha
        LEFT JOIN porton.house_availability_types hat ON ((hat.house_availability_type_id = ha.house_availability_type_id)))
    WHERE (((ha.house_availability_start_date)::date <= CURRENT_DATE) AND ((ha.house_availability_end_date)::date >= CURRENT_DATE))
    ORDER BY ha.house_id, ha.house_availability_end_date DESC
), latest_tasks AS (
    SELECT t.house_id,
        jsonb_agg(
            jsonb_build_object(
                'task_id', t.task_id,
                'task_type_id', tt.task_type_id,
                'task_type_name', tt.task_type_name,
                'task_progress_type_id', tpt.task_progress_type_id,
                'task_progress_type_name', tpt.task_progress_type_name,
                'start_time', t.start_time,
                'end_time', t.end_time,
                'description', t.description,
                'created_by', t.created_by,
                'created_at', t.created_at
            )
        ) FILTER (WHERE (t.task_id IS NOT NULL)) AS housetasks
    FROM ((porton.tasks t
        LEFT JOIN porton.task_types tt ON ((tt.task_type_id = t.task_type_id)))
        LEFT JOIN porton.task_progress_types tpt ON ((tpt.task_progress_type_id = t.task_progress_type_id)))
    GROUP BY t.house_id
)
SELECT h.house_id,
    h.house_name AS housename,
    ht.house_type_id AS housetypeid,
    ht.house_type_name AS housetypename,
    la.house_availability_type_id AS availabilityid,
    la.house_availability_type_name AS availabilityname,
    COALESCE(lt.housetasks, '[]'::jsonb) AS housetasks
FROM (((porton.houses h
    JOIN porton.house_types ht ON ((h.house_type_id = ht.house_type_id)))
    LEFT JOIN latest_availability la ON ((h.house_id = la.house_id)))
    LEFT JOIN latest_tasks lt ON ((h.house_id = lt.house_id)))
ORDER BY h.house_id;