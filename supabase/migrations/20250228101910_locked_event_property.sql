DROP VIEW IF EXISTS current_events_view;

CREATE VIEW current_events_view AS
SELECT 
    e.event_id,
    e.date,
    e.is_locked as isLocked,
    COALESCE(
        JSONB_AGG(
            DISTINCT JSONB_BUILD_OBJECT(
                'venueId', v.venue_id,
                'venueName', v.venue_name,
                'venueTypeId', vt.venue_types_id,
                'venueTypeName', vt.venue_type_name
            )
        ) FILTER (WHERE v.venue_id IS NOT NULL), '[]'::jsonb
    ) AS venues,
      COALESCE(
        JSONB_AGG(
            DISTINCT JSONB_BUILD_OBJECT(
                'userId', p.id,
                'firstName', p.first_name,
                'lastName', p.last_name
            )
        ) FILTER (WHERE p.id IS NOT NULL), '[]'::jsonb
    ) AS users
FROM events e
JOIN venue_event ve ON e.event_id = ve.event_id
LEFT JOIN venues v ON v.venue_id = ve.venue_id
LEFT JOIN venue_types vt ON vt.venue_types_id = v.venue_types_id
join event_user eu on eu.event_id = e.event_id
left join profiles p on eu.profile_id = p.id
where e.date >= current_date
GROUP BY e.event_id;

DROP FUNCTION IF EXISTS get_events_for_user(user_id UUID);

CREATE OR REPLACE FUNCTION get_events_for_user(user_id UUID)
RETURNS TABLE (
    event_id UUID,
    date DATE,
    venues JSONB,
    users JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.event_id,
        e.date::DATE,
        e.venues,
        e.users
    FROM current_events_view e
    WHERE e.users @> jsonb_build_array(jsonb_build_object('userId', user_id)) AND e.isLocked = true; 
END;
$$ LANGUAGE plpgsql;