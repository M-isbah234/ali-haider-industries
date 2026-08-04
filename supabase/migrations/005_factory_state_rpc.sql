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
