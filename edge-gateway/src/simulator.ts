import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing Supabase URL or Service Role Key in environment variables.");
  process.exit(1);
}

// Initialize Supabase client with Service Role Key to bypass RLS policies
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Helper function to generate random floats within a range
const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

async function startSimulator() {
  console.log("🚀 Starting Industrial IoT Simulator...");

  // 1. Ensure 36 looms exist in the database and fetch their UUIDs
  console.log("Checking for existing looms in the database...");
  let { data: looms, error: fetchError } = await supabase.from('looms').select('id, machine_number');
  
  if (fetchError) {
    console.error("❌ Error fetching looms:", fetchError.message);
    process.exit(1);
  }

  // If no looms exist, seed the database with 36 looms
  if (!looms || looms.length === 0) {
    console.log("No looms found. Seeding 36 initial looms...");
    const initialLooms = Array.from({ length: 36 }).map((_, i) => ({
      machine_number: `Loom ${i + 1}`,
      model: 'OmniPlus-i Connect',
      status: 'OFFLINE'
    }));
    
    const { data: insertedLooms, error: insertError } = await supabase
      .from('looms')
      .insert(initialLooms)
      .select('id, machine_number');

    if (insertError) {
      console.error("❌ Error seeding looms:", insertError.message);
      process.exit(1);
    }
    looms = insertedLooms;
  }

  const loomIds = looms!.map(l => l.id);
  console.log(`✅ Successfully loaded ${loomIds.length} looms. Starting high-speed telemetry loop...`);

  // 2. Start the 5-second interval loop
  setInterval(async () => {
    const timestamp = new Date().toISOString();
    console.log(`\n--- ⏱️ Tick: ${timestamp} ---`);
    
    // --- Generate Ambient Data ---
    // Target: Temp ~28°C, Humidity ~69%, Air Pressure ~7.1 Bar
    const ambientPayload = {
      temperature_c: randomInRange(27.5, 28.5),
      humidity_percent: randomInRange(68.0, 70.0),
      air_pressure_bar: randomInRange(7.0, 7.2)
    };
    
    // --- Generate Loom Telemetry & Statuses ---
    const telemetryPayload: any[] = [];
    const loomStatusPayload: any[] = [];

    loomIds.forEach((loom_id, index) => {
      // 85% chance to be running
      const isRunning = Math.random() > 0.15; 
      const status = isRunning ? 'RUN' : 'STOP';
      const rpm = isRunning ? Math.floor(randomInRange(500, 850)) : 0;
      const efficiency = isRunning ? randomInRange(75, 98) : randomInRange(60, 74);

      // Payload for the loom_telemetry table
      telemetryPayload.push({
        loom_id,
        rpm,
        efficiency_percentage: efficiency
      });

      // Payload for updating the main looms table status
      loomStatusPayload.push({
        id: loom_id,
        machine_number: looms![index].machine_number, // Required to avoid wiping out the name on upsert
        model: 'OmniPlus-i Connect',
        status
      });
    });

    console.log(`Sending Payload -> Ambient: ${ambientPayload.temperature_c.toFixed(1)}°C | Looms: ${telemetryPayload.length} records`);

    // --- Perform Bulk Inserts / Upserts concurrently ---
    const [ambientRes, telemetryRes, statusRes] = await Promise.all([
      // Insert ambient reading
      supabase.from('factory_ambient').insert(ambientPayload),
      // Bulk insert 36 telemetry records
      supabase.from('loom_telemetry').insert(telemetryPayload),
      // Bulk upsert to update the 'status' column on the looms table
      supabase.from('looms').upsert(loomStatusPayload)
    ]);

    // Handle Errors
    if (ambientRes.error) console.error("❌ Ambient Insert Error:", ambientRes.error.message);
    if (telemetryRes.error) console.error("❌ Telemetry Insert Error:", telemetryRes.error.message);
    if (statusRes.error) console.error("❌ Loom Status Upsert Error:", statusRes.error.message);
    
    if (!ambientRes.error && !telemetryRes.error && !statusRes.error) {
       console.log(`✅ [SUCCESS] Upserted 1 ambient record, updated 36 loom statuses, and inserted 36 telemetry rows.`);
    }

  }, 5000); // 5000ms = 5 seconds
}

// Ignite the simulator
startSimulator();
