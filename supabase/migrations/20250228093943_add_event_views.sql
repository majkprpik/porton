CREATE VIEW current_events_view AS
SELECT 
    e.event_id,
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