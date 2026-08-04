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
