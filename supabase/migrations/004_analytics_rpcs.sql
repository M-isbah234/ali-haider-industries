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
