"use client";
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface FactoryState {
  ambient: {
    temperature_c: number;
    humidity_percent: number;
    air_pressure_bar: number;
  } | null;
  running_looms: number;
  stopped_looms: number;
  average_efficiency: number;
  looms: Array<{
    id: string;
    machine_number: string;
    model: string;
    status: string;
    rpm: number;
    efficiency_percentage: number;
  }>;
}

export const useFactoryTelemetry = () => {
  const [factoryState, setFactoryState] = useState<FactoryState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Fetch the initial heavy payload via RPC
    const fetchInitialState = async () => {
      try {
        setLoading(true);
        const { data, error: rpcError } = await supabase.rpc('get_latest_factory_state');
        
        if (rpcError) throw rpcError;
        setFactoryState(data);
      } catch (err: any) {
        console.error("Error fetching factory state:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialState();

    // 2. Subscribe to high-frequency loom_telemetry inserts
    const telemetrySubscription = supabase
      .channel('loom_telemetry_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'loom_telemetry' },
        (payload) => {
          setFactoryState((prev) => {
            if (!prev) return prev;
            
            // We use a map to ensure we only update the specific loom
            const updatedLooms = prev.looms.map((loom) => {
              if (loom.id === payload.new.loom_id) {
                return {
                  ...loom,
                  rpm: payload.new.rpm,
                  efficiency_percentage: payload.new.efficiency_percentage,
                };
              }
              return loom;
            });
            
            // Recalculate average efficiency on the fly
            const totalEfficiency = updatedLooms.reduce((acc, curr) => acc + (curr.efficiency_percentage || 0), 0);
            const avg_efficiency = updatedLooms.length > 0 ? totalEfficiency / updatedLooms.length : 0;

            return {
              ...prev,
              looms: updatedLooms,
              average_efficiency: avg_efficiency
            };
          });
        }
      )
      .subscribe();

    // 3. Subscribe to loom status updates (RUN/STOP flips)
    const loomsSubscription = supabase
      .channel('looms_changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'looms' },
        (payload) => {
          setFactoryState((prev) => {
            if (!prev) return prev;
            
            let running = 0;
            let stopped = 0;

            const updatedLooms = prev.looms.map((loom) => {
              const status = loom.id === payload.new.id ? payload.new.status : loom.status;
              if (status === 'RUN') running++;
              else if (status === 'STOP') stopped++;
              
              if (loom.id === payload.new.id) {
                return { ...loom, status: payload.new.status };
              }
              return loom;
            });

            return {
              ...prev,
              looms: updatedLooms,
              running_looms: running,
              stopped_looms: stopped
            };
          });
        }
      )
      .subscribe();

    // 4. Subscribe to factory_ambient environment updates
    const ambientSubscription = supabase
      .channel('factory_ambient_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'factory_ambient' },
        (payload) => {
          setFactoryState((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              ambient: {
                temperature_c: payload.new.temperature_c,
                humidity_percent: payload.new.humidity_percent,
                air_pressure_bar: payload.new.air_pressure_bar,
              }
            };
          });
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(telemetrySubscription);
      supabase.removeChannel(loomsSubscription);
      supabase.removeChannel(ambientSubscription);
    };
  }, []);

  return { factoryState, loading, error };
};

