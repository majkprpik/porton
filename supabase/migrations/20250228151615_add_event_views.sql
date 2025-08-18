DROP VIEW IF EXISTS work_groups_view;

CREATE VIEW porton.work_groups_view AS
SELECT 
    wg.work_group_id,
    wg.created_at,
    wg.is_locked AS isLocked,
    COALESCE(
        JSONB_AGG(
            DISTINCT JSONB_BUILD_OBJECT(
                'houseId', h.house_id,
                'houseNumber', h.house_number,
                'houseTypeId', ht.house_type_id,
                'houseTypeName', ht.house_type_name
            )
        ) FILTER (WHERE h.house_id IS NOT NULL), '[]'::jsonb
    ) AS houses,
    COALESCE(
        JSONB_AGG(
            DISTINCT JSONB_BUILD_OBJECT(
                'userId', p.id,
                'firstName', p.first_name,
                'lastName', p.last_name
            )
        ) FILTER (WHERE p.id IS NOT NULL), '[]'::jsonb
    ) AS profiles
FROM porton.work_groups wg
JOIN porton.work_group_houses wgh ON wg.work_group_id = wgh.work_group_id
LEFT JOIN porton.houses h ON h.house_id = wgh.house_id
LEFT JOIN porton.house_types ht ON ht.house_type_id = h.house_type_id
JOIN porton.work_group_profiles wgp ON wgp.work_group_id = wg.work_group_id
LEFT JOIN porton.profiles p ON wgp.profile_id = p.id
GROUP BY wg.work_group_id;


CREATE OR REPLACE FUNCTION porton.get_events_for_user(user_id UUID)
RETURNS TABLE (
    work_group_id INT,
    created_at DATE,
    houses JSONB,
    profiles JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wgv.work_group_id,
        wgv.created_at::DATE,  
        wgv.houses,
        wgv.profiles
    FROM porton.work_groups_view wgv
    WHERE wgv.users @> jsonb_build_array(jsonb_build_object('userId', user_id)) 
    AND wgv.isLocked = TRUE; 
END;
$$ LANGUAGE plpgsql;