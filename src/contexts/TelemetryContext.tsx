"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

import { LoomState, AmbientState, SolarState, TelemetryContextType, LoomStatusCode } from '../types';

const generateInitial36Looms = (): Record<number, LoomState> => {
  const result: Record<number, LoomState> = {};
  
  // 36 loom status distribution showcasing all 13 states across lines:
  const statusDistribution: LoomStatusCode[] = [
    'RUNNING',           // Loom 1
    'WARP_BREAK',        // Loom 2
    'WEFT_BREAK',        // Loom 3
    'CONE_BREAK',        // Loom 4
    'SELVEDGE_BREAK',    // Loom 5
    'SELVEDGE_BREAK',    // Loom 6
    'ELECTRICAL_ERROR',  // Loom 7
    'MECHANICAL_ERROR',  // Loom 8
    'BEAM_ERROR',        // Loom 9
    'DOFFING',           // Loom 10
    'OLS',               // Loom 11
    'LOW_AIR_PRESSURE',  // Loom 12
    'RUNNING',           // Loom 13 (Will be configured as Oil Change Due)
    'RUNNING',           // Loom 14 (Will be configured as Oil Overdue)
    'RUNNING',           // Loom 15
    'WARP_BREAK',        // Loom 16
    'WEFT_BREAK',        // Loom 17
    'RUNNING',           // Loom 18
    'RUNNING',           // Loom 19
    'SELVEDGE_BREAK',    // Loom 20
    'RUNNING',           // Loom 21
    'LOW_AIR_PRESSURE',  // Loom 22
    'RUNNING',           // Loom 23
    'DOFFING',           // Loom 24
    'RUNNING',           // Loom 25
    'WEFT_BREAK',        // Loom 26
    'RUNNING',           // Loom 27
    'MECHANICAL_ERROR',  // Loom 28
    'RUNNING',           // Loom 29
    'WARP_BREAK',        // Loom 30
    'RUNNING',           // Loom 31
    'LOW_AIR_PRESSURE',  // Loom 32
    'RUNNING',           // Loom 33
    'BEAM_ERROR',        // Loom 34
    'RUNNING',           // Loom 35
    'RUNNING',           // Loom 36
  ];

  for (let i = 1; i <= 36; i++) {
    const status = statusDistribution[i - 1] || 'RUNNING';
    const isRunning = status === 'RUNNING';
    
    // Custom oil states for demonstration:
    // Target = 5000 hrs, threshold = 200 hrs
    let runningHours = 3400 + i * 40;
    let oilLastHours = 0;
    let oilLastDate = '2026-01-10';
    let targetHours = 5000;
    let warningThreshold = 200;

    if (i === 13) {
      // Nearing due state: 4850 hrs accumulated since last change (150 remaining <= 200 threshold)
      runningHours = 4850;
      oilLastHours = 0;
    } else if (i === 14) {
      // Overdue state: 5180 hrs accumulated since last change (-180 remaining <= 0)
      runningHours = 5180;
      oilLastHours = 0;
    } else {
      oilLastHours = Math.max(0, runningHours - Math.floor(1000 + (i * 90)));
    }

    result[i] = {
      loom_id: `loom-${i}`,
      loom_number: i,
      status,
      rpm: isRunning ? Math.floor(750 + Math.random() * 50) : 0,
      efficiency: isRunning
        ? parseFloat((89 + Math.random() * 9.5).toFixed(1))
        : parseFloat((65 + Math.random() * 18).toFixed(1)),
      total_picks: 125000 + i * 1400,
      total_meters: 3400 + i * 45,
      warp_stops_daily: Math.floor(Math.random() * 4),
      filling_stops_daily: Math.floor(Math.random() * 3),
      last_updated: new Date().toISOString(),

      running_hours: parseFloat(runningHours.toFixed(1)),
      oil_target_hours: targetHours,
      oil_last_date: oilLastDate,
      oil_last_hours: oilLastHours,
      oil_warning_threshold: warningThreshold
    };
  }
  return result;
};

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

export const TelemetryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [looms, setLooms] = useState<Record<number, LoomState>>(() => generateInitial36Looms());
  const [ambient, setAmbient] = useState<AmbientState | null>({
    main_air_pressure_bar: 7.1,
    hall_temperature_celsius: 28.5,
    hall_humidity_percentage: 64.0
  });
  const [solar, setSolar] = useState<SolarState | null>(null);
  const [selectedLoom, setSelectedLoom] = useState<number | 'GLOBAL'>('GLOBAL');
  const [mockMode, setMockMode] = useState(false);

  const updateLoomOilSettings = (
    loomNumber: number,
    settings: { targetHours: number; lastDate: string; lastHours: number; warningThreshold: number }
  ) => {
    setLooms(prev => {
      const existing = prev[loomNumber];
      if (!existing) return prev;
      return {
        ...prev,
        [loomNumber]: {
          ...existing,
          oil_target_hours: settings.targetHours,
          oil_last_date: settings.lastDate,
          oil_last_hours: settings.lastHours,
          oil_warning_threshold: settings.warningThreshold,
        }
      };
    });
    toast.success(`Updated Oil Maintenance configuration for Loom ${loomNumber < 10 ? '0' + loomNumber : loomNumber}`);
  };

  const resetOilChange = (loomNumber: number) => {
    setLooms(prev => {
      const existing = prev[loomNumber];
      if (!existing) return prev;
      const today = new Date().toISOString().split('T')[0];
      return {
        ...prev,
        [loomNumber]: {
          ...existing,
          oil_last_date: today,
          oil_last_hours: existing.running_hours,
        }
      };
    });
    toast.success(`Oil change recorded! Maintenance hours reset for Loom ${loomNumber < 10 ? '0' + loomNumber : loomNumber}`);
  };

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
          const mappedLooms: Record<number, LoomState> = { ...generateInitial36Looms() };
          if (Array.isArray(data.looms)) {
            data.looms.forEach((l: any) => {
              const num = parseInt(l.machine_number.replace('Loom ', ''), 10) || parseInt(l.machine_number, 10);
              const prev = mappedLooms[num] || {};
              mappedLooms[num] = {
                ...prev,
                loom_id: l.id,
                loom_number: num,
                status: l.status === 'RUN' ? 'RUNNING' : l.status === 'STOP' ? 'OLS' : l.status,
                rpm: l.rpm || 0,
                efficiency: l.efficiency_percentage || 0,
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
                status: updated.status === 'RUN' ? 'RUNNING' : updated.status === 'STOP' ? 'OLS' : updated.status
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

  // Live telemetry simulation: jitter RPM and slowly accumulate live running hours for running looms
  useEffect(() => {
    const jitterInterval = setInterval(() => {
      setLooms(prev => {
        const next = { ...prev };
        let hasChanges = false;
        
        Object.keys(next).forEach(key => {
          const num = parseInt(key, 10);
          const loom = next[num];
          if (loom.status === 'RUNNING' && loom.rpm > 0) {
            // Jitter RPM between -3 and +3 to look highly realistic
            const jitter = Math.floor(Math.random() * 7) - 3;
            // Accumulate fractional running hours (approx 0.1 hrs per tick simulation step for visible real-time progress)
            const addHours = 0.05;
            next[num] = { 
              ...loom, 
              rpm: Math.max(0, loom.rpm + jitter),
              running_hours: parseFloat((loom.running_hours + addHours).toFixed(1))
            };
            hasChanges = true;
          }
        });
        
        return hasChanges ? next : prev;
      });
    }, 1500);

    return () => clearInterval(jitterInterval);
  }, []);

  return (
    <TelemetryContext.Provider value={{ looms, ambient, solar, selectedLoom, setSelectedLoom, updateLoomOilSettings, resetOilChange, mockMode }}>
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

