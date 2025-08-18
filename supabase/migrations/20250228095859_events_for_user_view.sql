CREATE OR REPLACE FUNCTION get_events_for_user(user_id UUID)
RETURNS TABLE (
    event_id UUID,
    event_date DATE,
    venues JSONB,
    users JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.event_id,
        e.event_date,
        e.venues,
        e.users
    FROM current_events_view e
    WHERE e.users @> jsonb_build_array(jsonb_build_object('userId', user_id)); -- Check if user is part of the event
END;
$$ LANGUAGE plpgsql;