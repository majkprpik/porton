DROP TABLE IF EXISTS porton.pinned_charts;

CREATE TABLE IF NOT EXISTS porton.pinned_charts (
    id SERIAL PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES porton.profiles(id) ON DELETE CASCADE,
    chart_name text NOT NULL
);
