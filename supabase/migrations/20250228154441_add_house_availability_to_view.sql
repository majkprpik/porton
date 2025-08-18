drop view porton.house_status;

CREATE VIEW porton.house_status AS
SELECT 
    h.house_id,
    h.house_name AS houseName,
    ht.house_type_id AS houseTypeId,
    ht.house_type_name AS houseTypeName,
    ha.house_availability_type_id AS availabilityId,
    hat.house_availability_type_name AS availabilityName,
    COALESCE(
        JSONB_AGG(
            JSONB_BUILD_OBJECT(
                'taskId', t.task_id,
                'taskTypeId', tt.task_type_id,
                'taskTypeName', tt.task_type_name,
                'taskProgressTypeId', tpt.task_progress_type_id,
                'taskProgressTypeName', tpt.task_progress_type_name,
                'startTime', t.start_time,
                'endTime', t.end_time
            )
        ) FILTER (WHERE t.task_id IS NOT NULL), '[]'::jsonb
    ) AS houseTasks
FROM porton.houses h
JOIN porton.house_types ht ON h.house_type_id = ht.house_type_id
JOIN porton.house_availabilities ha ON h.house_id = ha.house_id 
    AND ha.house_availability_start_date::DATE <= CURRENT_DATE 
    AND ha.house_availability_end_date::DATE >= CURRENT_DATE  
LEFT JOIN porton.house_availability_types hat ON hat.house_availability_type_id = ha.house_availability_type_id
LEFT JOIN porton.tasks t ON h.house_id = t.house_id AND t.start_time::DATE = CURRENT_DATE
LEFT JOIN porton.task_types tt ON tt.task_type_id = t.task_type_id
LEFT JOIN porton.task_progress_types tpt ON tpt.task_progress_type_id = t.task_progress_type_id
GROUP BY 
    h.house_id, h.house_name, 
    ht.house_type_id, ht.house_type_name, 
    ha.house_availability_type_id, hat.house_availability_type_name; 