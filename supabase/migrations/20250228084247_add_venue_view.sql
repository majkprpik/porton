CREATE VIEW venue_active_status_view AS
SELECT 
    v.venue_id,
    v.venue_name AS venueName,
    vt.venue_type_name AS venueType,
    vs.start_time,
    COALESCE(
        JSONB_AGG(
            JSONB_BUILD_OBJECT(
                'venueStatusId', vs.venue_status_id,
                'statusType', vst.venue_status_type_name,
                'progressType', vsp.venue_status_progress_type_name,
                'startTime', vs.start_time,
                'endTime', vs.end_time
            )
        ) FILTER (WHERE vs.venue_status_id IS NOT NULL), '[]'::jsonb
    ) AS venueStatuses
FROM venues v
JOIN venue_types vt ON v.venue_types_id = vt.venue_types_id
LEFT JOIN venue_statuses vs ON v.venue_id = vs.venue_id
LEFT JOIN venue_status_types vst ON vs.venue_status_type_id = vst.venue_status_type_id
LEFT JOIN venue_status_progress_types vsp ON vs.venue_status_progress_type_id = vsp.venue_status_progress_type_id
GROUP BY v.venue_id, v.venue_name, vt.venue_type_name, vs.start_time;