-- 003_shift_metrics_view.sql

-- We need a history table to run aggregations over time.
-- The edge dispatcher can insert here periodically (e.g., every minute) to save space.
CREATE TABLE IF NOT EXISTS loom_telemetry_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loom_id UUID NOT NULL REFERENCES looms(id) ON DELETE CASCADE,
    total_picks BIGINT NOT NULL,
    total_meters NUMERIC(10, 2) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE loom_telemetry_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read on history" ON loom_telemetry_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow service_role full access history" ON loom_telemetry_history FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Create a view for the current shift (assuming shifts are 8 hours starting at 00:00, 08:00, 16:00 for simplicity)
-- A more robust system would have a shift schedule table, but we use a dynamic time boundary here.
CREATE OR REPLACE VIEW loom_shift_metrics AS
WITH current_shift AS (
    SELECT 
        CASE 
            WHEN EXTRACT(HOUR FROM NOW()) >= 0 AND EXTRACT(HOUR FROM NOW()) < 8 THEN DATE_TRUNC('day', NOW())
            WHEN EXTRACT(HOUR FROM NOW()) >= 8 AND EXTRACT(HOUR FROM NOW()) < 16 THEN DATE_TRUNC('day', NOW()) + INTERVAL '8 hours'
            ELSE DATE_TRUNC('day', NOW()) + INTERVAL '16 hours'
        END as start_time
)
SELECT 
    h.loom_id,
    MAX(h.total_picks) - MIN(h.total_picks) as shift_picks,
    MAX(h.total_meters) - MIN(h.total_meters) as shift_meters,
    cs.start_time as shift_start
FROM loom_telemetry_history h
CROSS JOIN current_shift cs
WHERE h.recorded_at >= cs.start_time
GROUP BY h.loom_id, cs.start_time;

-- Grant access to the view
GRANT SELECT ON loom_shift_metrics TO authenticated;
GRANT SELECT ON loom_shift_metrics TO service_role;
