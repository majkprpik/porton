DROP VIEW IF EXISTS porton.house_statuses_view;

CREATE VIEW porton.house_statuses_view AS
WITH latest_availability AS (
    -- Get only the most relevant availability for each house
    SELECT DISTINCT ON (ha.house_id) 
        ha.house_id, 
        ha.house_availability_type_id, 
        ha.house_availability_start_date, 
        ha.house_availability_end_date, 
        hat.house_availability_type_name
    FROM porton.house_availabilities ha
    LEFT JOIN porton.house_availability_types hat 
        ON hat.house_availability_type_id = ha.house_availability_type_id
    WHERE ha.house_availability_start_date::DATE <= CURRENT_DATE 
        AND ha.house_availability_end_date::DATE >= CURRENT_DATE 
    ORDER BY ha.house_id, ha.house_availability_end_date DESC
), latest_tasks AS (
    -- Aggregate tasks per house to avoid duplication
    SELECT 
        t.house_id,
        JSONB_AGG(
            JSONB_BUILD_OBJECT(
                'taskId', t.task_id,
                'taskTypeId', tt.task_type_id,
                'taskTypeName', tt.task_type_name,
                'taskProgressTypeId', tpt.task_progress_type_id,
                'taskProgressTypeName', tpt.task_progress_type_name,
                'startTime', t.start_time,
                'endTime', t.end_time,
                'description', t.description
            )
        ) FILTER (WHERE t.task_id IS NOT NULL) AS houseTasks
    FROM porton.tasks t
    LEFT JOIN porton.task_types tt ON tt.task_type_id = t.task_type_id
    LEFT JOIN porton.task_progress_types tpt ON tpt.task_progress_type_id = t.task_progress_type_id
    WHERE t.start_time::DATE = CURRENT_DATE
    GROUP BY t.house_id
)
SELECT 
    h.house_id,
    h.house_name AS houseName,
    ht.house_type_id AS houseTypeId,
    ht.house_type_name AS houseTypeName,
    la.house_availability_type_id AS availabilityId,
    la.house_availability_type_name AS availabilityName,
    COALESCE(lt.houseTasks, '[]'::jsonb) AS houseTasks
FROM porton.houses h
JOIN porton.house_types ht ON h.house_type_id = ht.house_type_id
LEFT JOIN latest_availability la ON h.house_id = la.house_id  -- Use only 1 availability per house
LEFT JOIN latest_tasks lt ON h.house_id = lt.house_id  -- Aggregate tasks into JSONB
ORDER BY h.house_id;
