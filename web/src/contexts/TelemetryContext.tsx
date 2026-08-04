"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

// Match the Edge schemas
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

  // Critical Alerting Engine
  useEffect(() => {
    if (ambient && ambient.main_air_pressure_bar < 5.5) {
      toast.error(
        `CRITICAL WARNING: Main Compressor Pressure Dropping! (${ambient.main_air_pressure_bar.toFixed(2)} Bar)`,
        {
          duration: 6000,
          position: 'top-center',
          style: {
            background: '#ef4444',
            color: '#fff',
            fontWeight: 'bold',
            padding: '16px',
            fontSize: '18px'
          },
        }
      );
    }
  }, [ambient?.main_air_pressure_bar]);

  useEffect(() => {
    // Check if we're connected to real Supabase or running in mock mode
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://mock.supabase.co') {
      // 1. Initial Fetch
      const fetchInitialData = async () => {
        const { data: loomData } = await supabase.from('loom_live_telemetry').select('*, looms(loom_number)');
        const { data: shiftData } = await supabase.from('loom_shift_metrics').select('*');
        
        if (loomData) {
          const mappedLooms: Record<number, LoomState> = {};
          loomData.forEach(l => {
             const loomNumber = l.looms?.loom_number || parseInt(l.loom_id.slice(-2), 16) % 36 + 1;
             const shiftInfo = shiftData?.find(s => s.loom_id === l.loom_id);
             mappedLooms[loomNumber] = { 
               ...l, 
               loom_number: loomNumber,
               shift_picks: shiftInfo?.shift_picks || 0,
               shift_meters: shiftInfo?.shift_meters || 0
             };
          });
          setLooms(mappedLooms);
        }

        const { data: ambientData } = await supabase.from('factory_ambient_telemetry').select('*').order('recorded_at', { ascending: false }).limit(1);
        if (ambientData && ambientData.length > 0) setAmbient(ambientData[0]);

        const { data: solarData } = await supabase.from('solar_live_telemetry').select('*').order('recorded_at', { ascending: false }).limit(1);
        if (solarData && solarData.length > 0) setSolar(solarData[0]);
      };

      fetchInitialData();

      // 2. Setup Realtime Subscriptions
      const channel = supabase.channel('factory_telemetry')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'loom_live_telemetry' }, (payload: any) => {
          setLooms(prev => {
            // Need a way to map loom_id back to loom_number if we don't fetch join here
            // We assume the payload contains the updated row
            const updated = payload.new as LoomState;
            // Best effort without join (assuming frontend already has the map)
            const loomNumber = Object.values(prev).find(l => l.loom_id === updated.loom_id)?.loom_number;
            if (loomNumber) {
               return { ...prev, [loomNumber]: { ...prev[loomNumber], ...updated } };
            }
            return prev;
          });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'factory_ambient_telemetry' }, (payload: any) => {
          setAmbient(payload.new as AmbientState);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'solar_live_telemetry' }, (payload: any) => {
           setSolar(payload.new as SolarState);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      console.log('⚠️ Running Frontend in MOCK MODE (No Supabase URL provided)');
      setMockMode(true);
      // Generate initial mock state for 36 looms
      const initialLooms: Record<number, LoomState> = {};
      for (let i = 1; i <= 36; i++) {
        initialLooms[i] = {
          loom_number: i,
          status: 'RUNNING',
          rpm: 600 + Math.floor(Math.random() * 200),
          total_picks: Math.floor(Math.random() * 1000000),
          total_meters: Math.floor(Math.random() * 10000),
          efficiency: 85 + (Math.random() * 10),
          warp_stops_daily: Math.floor(Math.random() * 5),
          filling_stops_daily: Math.floor(Math.random() * 5),
          shift_picks: Math.floor(Math.random() * 50000),
          shift_meters: Math.floor(Math.random() * 500),
          last_updated: new Date().toISOString()
        };
      }
      setLooms(initialLooms);
      setAmbient({ main_air_pressure_bar: 7.0, hall_temperature_celsius: 28.5, hall_humidity_percentage: 65.0 });
      setSolar({ current_generation_kw: 150.5, daily_yield_kwh: 850.2 });

      // Mock update loop (1s)
      const interval = setInterval(() => {
        setLooms(prev => {
          const next = { ...prev };
          Object.keys(next).forEach(key => {
            const num = parseInt(key);
            const loom = { ...next[num] };
            
            if (Math.random() < 0.005) {
                if (loom.status === 'RUNNING') {
                    const stops: any[] = ['STOPPED_WARP', 'STOPPED_FILLING', 'STOPPED_MANUAL'];
                    loom.status = stops[Math.floor(Math.random() * stops.length)];
                    loom.rpm = 0;
                    if(loom.status === 'STOPPED_WARP') loom.warp_stops_daily++;
                    if(loom.status === 'STOPPED_FILLING') loom.filling_stops_daily++;
                } else {
                    loom.status = 'RUNNING';
                }
            }
            
            if (loom.status === 'RUNNING') {
                loom.rpm = 600 + Math.floor(Math.random() * 200);
                const picksGained = Math.floor(loom.rpm / 60);
                const metersGained = (loom.rpm / 60) * 0.001;
                loom.total_picks += picksGained;
                loom.total_meters += metersGained;
                loom.shift_picks = (loom.shift_picks || 0) + picksGained;
                loom.shift_meters = (loom.shift_meters || 0) + metersGained;
                loom.efficiency = loom.efficiency + (0.1 * (95 - loom.efficiency) * Math.random());
            } else {
                loom.efficiency = Math.max(0, loom.efficiency - 0.05);
            }
            loom.last_updated = new Date().toISOString();
            next[num] = loom;
          });
          return next;
        });

        setAmbient(prev => {
           if (!prev) return null;
           const isPressureDrop = Math.random() < 0.02;
           const airPressure = isPressureDrop ? 5.2 + (Math.random() * 0.2) : 6.8 + (Math.random() * 0.4);
           return {
             main_air_pressure_bar: airPressure,
             hall_temperature_celsius: 28 + (Math.random() * 2),
             hall_humidity_percentage: 65 + (Math.random() * 5)
           };
        });

        setSolar(prev => prev ? {
            current_generation_kw: 100 + (Math.random() * 50),
            daily_yield_kwh: prev.daily_yield_kwh + 0.1
        } : null);
      }, 1000);

      return () => clearInterval(interval);
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


