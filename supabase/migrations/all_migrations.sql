-- 001_initial_schema.sql

-- Create the Looms table
CREATE TABLE IF NOT EXISTS looms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loom_number INTEGER NOT NULL UNIQUE CHECK (loom_number >= 1 AND loom_number <= 36),
    model VARCHAR(50) NOT NULL CHECK (model IN ('OmniPlus-i', 'Summum', 'Legacy_Membrane')),
    ip_address VARCHAR(15) NOT NULL
);

-- Create the Real-Time Telemetry table
CREATE TABLE IF NOT EXISTS loom_live_telemetry (
    loom_id UUID PRIMARY KEY REFERENCES looms(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('RUNNING', 'STOPPED_WARP', 'STOPPED_FILLING', 'STOPPED_MANUAL')),
    rpm INTEGER NOT NULL DEFAULT 0,
    total_picks BIGINT NOT NULL DEFAULT 0,
    total_meters NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    efficiency NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (efficiency >= 0.00 AND efficiency <= 100.00),
    warp_stops_daily INTEGER NOT NULL DEFAULT 0,
    filling_stops_daily INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the Downtime Logs table
CREATE TABLE IF NOT EXISTS downtime_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loom_id UUID NOT NULL REFERENCES looms(id) ON DELETE CASCADE,
    stop_reason VARCHAR(50) NOT NULL,
    downtime_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    downtime_end TIMESTAMP WITH TIME ZONE
);

-- Create the Factory Ambient Telemetry table
CREATE TABLE IF NOT EXISTS factory_ambient_telemetry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    main_air_pressure_bar NUMERIC(5, 2) NOT NULL,
    hall_temperature_celsius NUMERIC(5, 2) NOT NULL,
    hall_humidity_percentage NUMERIC(5, 2) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create the Solar Live Telemetry table
CREATE TABLE IF NOT EXISTS solar_live_telemetry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    current_generation_kw NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    daily_yield_kwh NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Configure RLS
ALTER TABLE looms ENABLE ROW LEVEL SECURITY;
ALTER TABLE loom_live_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE downtime_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE factory_ambient_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE solar_live_telemetry ENABLE ROW LEVEL SECURITY;

-- Assuming a basic 'authenticated' role for read access
CREATE POLICY "Allow authenticated read access on looms" ON looms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access on live telemetry" ON loom_live_telemetry FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access on downtime" ON downtime_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access on ambient" ON factory_ambient_telemetry FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access on solar" ON solar_live_telemetry FOR SELECT TO authenticated USING (true);

-- Allow service role to do everything (Edge script will use service role key for simplicity in demo)
CREATE POLICY "Allow service_role full access looms" ON looms FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow service_role full access telemetry" ON loom_live_telemetry FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow service_role full access downtime" ON downtime_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow service_role full access ambient" ON factory_ambient_telemetry FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow service_role full access solar" ON solar_live_telemetry FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Note: In a real Supabase environment, you would enable publication for these tables to be broadcast via WebSockets.
-- ALTER PUBLICATION supabase_realtime ADD TABLE loom_live_telemetry;
-- ALTER PUBLICATION supabase_realtime ADD TABLE factory_ambient_telemetry;
-- ALTER PUBLICATION supabase_realtime ADD TABLE solar_live_telemetry;
-- 002_downtime_trigger.sql

-- Function to handle downtime logging logic
CREATE OR REPLACE FUNCTION handle_loom_downtime()
RETURNS TRIGGER AS $$
BEGIN
    -- Case 1: Loom stops running
    IF NEW.status LIKE 'STOPPED_%' AND OLD.status = 'RUNNING' THEN
        INSERT INTO downtime_logs (loom_id, stop_reason, downtime_start)
        VALUES (NEW.loom_id, NEW.status, NOW());
    END IF;

    -- Case 2: Loom resumes running
    IF NEW.status = 'RUNNING' AND OLD.status LIKE 'STOPPED_%' THEN
        -- Find the most recent open downtime log for this loom and close it
        UPDATE downtime_logs
        SET downtime_end = NOW()
        WHERE loom_id = NEW.loom_id AND downtime_end IS NULL
        -- Ensure we only update the latest one, just in case
        AND id = (
            SELECT id FROM downtime_logs 
            WHERE loom_id = NEW.loom_id AND downtime_end IS NULL 
            ORDER BY downtime_start DESC LIMIT 1
        );
    END IF;

    -- Always update last_updated
    NEW.last_updated = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to execute the function on updates to loom_live_telemetry
DROP TRIGGER IF EXISTS loom_downtime_trigger ON loom_live_telemetry;
CREATE TRIGGER loom_downtime_trigger
BEFORE UPDATE ON loom_live_telemetry
FOR EACH ROW
EXECUTE FUNCTION handle_loom_downtime();
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
-- 004_analytics_rpcs.sql
-- Migration to add backend RPC for OEE Analytics

CREATE OR REPLACE FUNCTION calculate_factory_oee(time_range text)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    start_time timestamp with time zone;
    total_possible_minutes numeric;
    total_downtime_minutes numeric := 0;
    availability_pct numeric;
    avg_rpm numeric;
    performance_pct numeric;
    quality_pct numeric := 100.0; -- Defaulting to 100% for MVP
    oee_pct numeric;
    pareto_data json;
    result json;
BEGIN
    -- 1. Determine time window
    IF time_range = 'shift' THEN
        start_time := NOW() - INTERVAL '8 hours';
        total_possible_minutes := 8 * 60 * 36; -- 8 hours * 60 mins * 36 looms
    ELSIF time_range = '24h' THEN
        start_time := NOW() - INTERVAL '24 hours';
        total_possible_minutes := 24 * 60 * 36;
    ELSIF time_range = '7d' THEN
        start_time := NOW() - INTERVAL '7 days';
        total_possible_minutes := 7 * 24 * 60 * 36;
    ELSE
        start_time := NOW() - INTERVAL '8 hours';
        total_possible_minutes := 8 * 60 * 36;
    END IF;

    -- 2. Availability Calculation
    SELECT COALESCE(SUM(duration_minutes), 0)
    INTO total_downtime_minutes
    FROM downtime_logs
    WHERE start_time >= calculate_factory_oee.start_time;

    availability_pct := GREATEST(0, (total_possible_minutes - total_downtime_minutes) / NULLIF(total_possible_minutes, 0) * 100);

    -- 3. Performance Calculation (Avg RPM / Rated Max 800 RPM)
    SELECT COALESCE(AVG(rpm), 0)
    INTO avg_rpm
    FROM loom_live_telemetry;

    performance_pct := LEAST(100, (avg_rpm / 800) * 100);

    -- Calculate OEE
    oee_pct := (availability_pct / 100) * (performance_pct / 100) * (quality_pct / 100) * 100;

    -- 4. Downtime Pareto
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO pareto_data
    FROM (
        SELECT stop_reason as reason, SUM(duration_minutes) as minutes
        FROM downtime_logs
        WHERE start_time >= calculate_factory_oee.start_time
        GROUP BY stop_reason
        ORDER BY minutes DESC
    ) t;

    -- 5. Construct Result JSON
    result := json_build_object(
        'availability', ROUND(availability_pct, 2),
        'performance', ROUND(performance_pct, 2),
        'quality', ROUND(quality_pct, 2),
        'oee', ROUND(oee_pct, 2),
        'pareto', pareto_data
    );

    RETURN result;
END;
$$;
-- 005_factory_state_rpc.sql

-- 1. Create looms table
CREATE TABLE IF NOT EXISTS looms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_number VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('RUN', 'STOP', 'OFFLINE'))
);

-- 2. Create loom_telemetry table
CREATE TABLE IF NOT EXISTS loom_telemetry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loom_id UUID NOT NULL REFERENCES looms(id) ON DELETE CASCADE,
    rpm INTEGER NOT NULL DEFAULT 0,
    efficiency_percentage FLOAT NOT NULL DEFAULT 0.0,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create factory_ambient table
CREATE TABLE IF NOT EXISTS factory_ambient (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    temperature_c FLOAT NOT NULL,
    humidity_percent FLOAT NOT NULL,
    air_pressure_bar FLOAT NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE looms ENABLE ROW LEVEL SECURITY;
ALTER TABLE loom_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE factory_ambient ENABLE ROW LEVEL SECURITY;

-- 5. Create basic RLS policies for authenticated users
CREATE POLICY "Allow authenticated read on looms" 
    ON looms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on loom_telemetry" 
    ON loom_telemetry FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on factory_ambient" 
    ON factory_ambient FOR SELECT TO authenticated USING (true);

-- Allow service role full access (for your edge gateway to insert data)
CREATE POLICY "Allow service_role full access looms" ON looms FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow service_role full access telemetry" ON loom_telemetry FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow service_role full access ambient" ON factory_ambient FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 6. Create RPC function to get the latest factory state
CREATE OR REPLACE FUNCTION get_latest_factory_state()
RETURNS JSON AS $$
DECLARE
    ambient_record RECORD;
    running_count INTEGER;
    stopped_count INTEGER;
    avg_efficiency FLOAT;
    looms_data JSON;
BEGIN
    -- Get latest ambient readings
    SELECT * INTO ambient_record 
    FROM factory_ambient 
    ORDER BY recorded_at DESC 
    LIMIT 1;

    -- Get counts of running vs stopped looms
    SELECT 
        COUNT(*) FILTER (WHERE status = 'RUN'),
        COUNT(*) FILTER (WHERE status = 'STOP')
    INTO running_count, stopped_count
    FROM looms;

    -- Get average efficiency from the latest telemetry per loom
    SELECT COALESCE(AVG(t.efficiency_percentage), 0)
    INTO avg_efficiency
    FROM (
        SELECT DISTINCT ON (loom_id) efficiency_percentage
        FROM loom_telemetry
        ORDER BY loom_id, recorded_at DESC
    ) t;

    -- Get latest telemetry combined with loom details for all looms
    SELECT json_agg(row_to_json(l_data))
    INTO looms_data
    FROM (
        SELECT 
            l.id,
            l.machine_number,
            l.model,
            l.status,
            t.rpm,
            t.efficiency_percentage,
            t.recorded_at
        FROM looms l
        LEFT JOIN LATERAL (
            SELECT rpm, efficiency_percentage, recorded_at
            FROM loom_telemetry
            WHERE loom_id = l.id
            ORDER BY recorded_at DESC
            LIMIT 1
        ) t ON true
        ORDER BY l.machine_number
    ) l_data;

    -- Return the combined JSON object
    RETURN json_build_object(
        'ambient', row_to_json(ambient_record),
        'running_looms', COALESCE(running_count, 0),
        'stopped_looms', COALESCE(stopped_count, 0),
        'average_efficiency', avg_efficiency,
        'looms', COALESCE(looms_data, '[]'::json)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
