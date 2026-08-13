export interface LoomState {
  loom_id?: string;
  loom_number: number;
  status: 'RUNNING' | 'STOPPED_WARP' | 'STOPPED_FILLING' | 'STOPPED_MANUAL' | 'RUN' | 'STOP' | 'OFFLINE';
  rpm: number;
  total_picks: number;
  total_meters: number;
  efficiency: number;
  warp_stops_daily: number;
  filling_stops_daily: number;
  shift_picks?: number;
  shift_meters?: number;
  last_updated?: string;
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

export interface TelemetryContextType {
  looms: Record<number, LoomState>;
  ambient: AmbientState | null;
  solar: SolarState | null;
  selectedLoom: number | 'GLOBAL';
  setSelectedLoom: (loom: number | 'GLOBAL') => void;
  mockMode: boolean;
}
