"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

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

interface TelemetryContextType {
  looms: Record<number, LoomState>;
  ambient: AmbientState | null;
  solar: SolarState | null;
  selectedLoom: number | 'GLOBAL';
  setSelectedLoom: (loom: number | 'GLOBAL') => void;
  mockMode: boolean;
}

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

export const TelemetryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [looms, setLooms] = useState<Record<number, LoomState>>({});
  const [ambient, setAmbient] = useState<AmbientState | null>(null);
  const [solar, setSolar] = useState<SolarState | null>(null);
  const [selectedLoom, setSelectedLoom] = useState<number | 'GLOBAL'>('GLOBAL');
  const [mockMode, setMockMode] = useState(false);

  useEffect(() => {
    if (ambient && ambient.main_air_pressure_bar < 5.5) {
      toast.error(
        `CRITICAL WARNING: Main Compressor Pressure Dropping! (${ambient.main_air_pressure_bar.toFixed(2)} Bar)`,
        { duration: 6000, position: 'top-center', style: { background: '#ef4444', color: '#fff', fontWeight: 'bold' } }
      );
    }
  }, [ambient?.main_air_pressure_bar]);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://mock.supabase.co') {
      const fetchInitialData = async () => {
        const { data, error } = await supabase.rpc('get_latest_factory_state');
        if (data && !error) {
          const mappedLooms: Record<number, LoomState> = {};
          if (Array.isArray(data.looms)) {
            data.looms.forEach((l: any) => {
              const num = parseInt(l.machine_number.replace('Loom ', ''), 10) || parseInt(l.machine_number, 10);
              mappedLooms[num] = {
                loom_id: l.id,
                loom_number: num,
                status: l.status === 'RUN' ? 'RUNNING' : l.status === 'STOP' ? 'STOPPED_MANUAL' : 'OFFLINE',
                rpm: l.rpm || 0,
                efficiency: l.efficiency_percentage || 0,
                total_picks: 0,
                total_meters: 0,
                warp_stops_daily: 0,
                filling_stops_daily: 0,
                last_updated: l.recorded_at
              };
            });
          }
          setLooms(mappedLooms);

          if (data.ambient) {
            setAmbient({
              main_air_pressure_bar: data.ambient.air_pressure_bar || 7.1,
              hall_temperature_celsius: data.ambient.temperature_c || 28.0,
              hall_humidity_percentage: data.ambient.humidity_percent || 65.0,
            });
          }
        }
      };

      fetchInitialData();

      const telemetryChannel = supabase.channel('telemetry_changes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'loom_telemetry' }, (payload: any) => {
          const updated = payload.new;
          setLooms(prev => {
            const next = { ...prev };
            const loomKey = Object.keys(next).find(k => next[parseInt(k)].loom_id === updated.loom_id);
            if (loomKey) {
              const key = parseInt(loomKey);
              next[key] = {
                ...next[key],
                rpm: updated.rpm,
                efficiency: updated.efficiency_percentage,
                last_updated: updated.recorded_at
              };
            }
            return next;
          });
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'looms' }, (payload: any) => {
          const updated = payload.new;
          setLooms(prev => {
            const next = { ...prev };
            const loomKey = Object.keys(next).find(k => next[parseInt(k)].loom_id === updated.id);
            if (loomKey) {
              const key = parseInt(loomKey);
              next[key] = {
                ...next[key],
                status: updated.status === 'RUN' ? 'RUNNING' : 'STOPPED_MANUAL'
              };
            }
            return next;
          });
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'factory_ambient' }, (payload: any) => {
          const updated = payload.new;
          setAmbient({
            main_air_pressure_bar: updated.air_pressure_bar,
            hall_temperature_celsius: updated.temperature_c,
            hall_humidity_percentage: updated.humidity_percent
          });
        })
        .subscribe();

      return () => {
        supabase.removeChannel(telemetryChannel);
      };
    } else {
      setMockMode(true);
    }
  }, []);

  return (
    <TelemetryContext.Provider value={{ looms, ambient, solar, selectedLoom, setSelectedLoom, mockMode }}>
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = () => {
  const context = useContext(TelemetryContext);
  if (context === undefined) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
};
