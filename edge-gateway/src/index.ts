import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
// In a real scenario, you'd import the real protocol readers here
import { startDeviceDrivers } from './mock-devices';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing. Running in dry-run mode (console only).');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Unified state representation matching Supabase schema
export interface LoomState {
  loom_id?: string;
  loom_number: number;
  status: 'RUNNING' | 'STOPPED_WARP' | 'STOPPED_FILLING' | 'STOPPED_MANUAL';
  rpm: number;
  total_picks: number;
  total_meters: number;
  efficiency: number;
  warp_stops_daily: number;
  filling_stops_daily: number;
}

export interface AmbientState {
  main_air_pressure_bar: number;
  hall_temperature_celsius: number;
  hall_humidity_percentage: number;
}

export interface SolarState {
  current_generation_kw: number;
  daily_yield_kwh: number;
}

// In-memory cache to accumulate data before pushing
const telemetryCache = {
  looms: new Map<number, LoomState>(),
  ambient: null as AmbientState | null,
  solar: null as SolarState | null,
  loomIdMap: new Map<number, string>() // maps loom_number to UUID
};

export function updateLoomCache(data: LoomState) {
  telemetryCache.looms.set(data.loom_number, data);
}

export function updateAmbientCache(data: AmbientState) {
  telemetryCache.ambient = data;
}

export function updateSolarCache(data: SolarState) {
  telemetryCache.solar = data;
}

async function resolveLoomIds() {
  if (!supabase) return;
  const { data, error } = await supabase.from('looms').select('id, loom_number');
  if (error) {
    console.error('Failed to fetch looms:', error);
    return;
  }
  data.forEach(l => {
    telemetryCache.loomIdMap.set(l.loom_number, l.id);
  });
}

async function dispatchLoop() {
  let tick = 0;
  setInterval(async () => {
    tick++;
    if (!supabase) {
        // Dry run printing
        console.log(`[DRY RUN] ${new Date().toISOString()} - Aggregated ${telemetryCache.looms.size} looms.`);
        return;
    }

    try {
      // 1. Dispatch Looms
      const loomUpdates = Array.from(telemetryCache.looms.values()).map(l => {
        const id = telemetryCache.loomIdMap.get(l.loom_number);
        return {
          loom_id: id,
          status: l.status,
          rpm: l.rpm,
          total_picks: l.total_picks,
          total_meters: l.total_meters,
          efficiency: l.efficiency,
          warp_stops_daily: l.warp_stops_daily,
          filling_stops_daily: l.filling_stops_daily
        };
      }).filter(l => l.loom_id); // Only send if we have a resolved UUID

      if (loomUpdates.length > 0) {
        const { error } = await supabase.from('loom_live_telemetry').upsert(loomUpdates, { onConflict: 'loom_id' });
        if (error) console.error('Error updating looms:', error.message);
      }

      // 2. Dispatch Ambient
      if (telemetryCache.ambient) {
        const { error } = await supabase.from('factory_ambient_telemetry').insert(telemetryCache.ambient);
        if (error) console.error('Error updating ambient:', error.message);
      }

      // 3. Dispatch Solar
      if (telemetryCache.solar) {
        const { error } = await supabase.from('solar_live_telemetry').insert(telemetryCache.solar);
        if (error) console.error('Error updating solar:', error.message);
      }

      // 4. Dispatch to History (Every 60 ticks / 60 seconds)
      if (tick % 60 === 0 && loomUpdates.length > 0) {
        const historyData = loomUpdates.map(l => ({
          loom_id: l.loom_id,
          total_picks: l.total_picks,
          total_meters: l.total_meters
        }));
        const { error } = await supabase.from('loom_telemetry_history').insert(historyData);
        if (error) console.error('Error updating history:', error.message);
        else console.log(`[HISTORY] Logged snapshot for shift metrics.`);
      }

      console.log(`[DISPATCH] Successfully dispatched telemetry at ${new Date().toISOString()}`);

    } catch (err) {
      console.error('Fatal dispatch error:', err);
    }
  }, 1000); // 1000ms throttling payload delivery
}

async function main() {
  console.log('🚀 Starting Edge Data Aggregator...');
  await resolveLoomIds();
  
  // Start the simulated/mock readers
  // Start the newly separated OPC UA and Modbus driver loops
  startDeviceDrivers();

  // Start the dispatcher
  dispatchLoop();
}

main().catch(console.error);
