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
