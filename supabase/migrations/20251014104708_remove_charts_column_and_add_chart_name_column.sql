ALTER TABLE porton.pinned_charts
DROP COLUMN charts;

ALTER TABLE porton.pinned_charts
ADD COLUMN chart_name TEXT;