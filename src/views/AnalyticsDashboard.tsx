"use client";
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  ComposedChart, Line, Area
} from 'recharts';

export const AnalyticsDashboard: React.FC = () => {
  // MOCK DATA for get_daily_oee_summary()
  const oeeData = useMemo(() => [
    { date: 'Mon', oee: 82, availability: 85, performance: 96, quality: 100 },
    { date: 'Tue', oee: 84, availability: 88, performance: 95, quality: 100 },
    { date: 'Wed', oee: 79, availability: 80, performance: 98, quality: 100 },
    { date: 'Thu', oee: 86, availability: 90, performance: 95, quality: 100 },
    { date: 'Fri', oee: 88, availability: 92, performance: 95, quality: 100 },
    { date: 'Sat', oee: 90, availability: 93, performance: 96, quality: 100 },
    { date: 'Sun', oee: 91, availability: 94, performance: 96, quality: 100 },
  ], []);

  // MOCK DATA for get_downtime_pareto()
  const paretoData = useMemo(() => [
    { reason: 'Warp Stop', minutes: 420 },
    { reason: 'Filling Stop', minutes: 280 },
    { reason: 'Manual Stop', minutes: 150 },
    { reason: 'Air Pressure Drop', minutes: 80 },
    { reason: 'Maintenance', minutes: 45 },
  ], []);

  // MOCK DATA for get_energy_offset()
  const energyData = useMemo(() => [
    { date: 'Mon', solar_generation_kwh: 1200, factory_load_kwh: 1450 },
    { date: 'Tue', solar_generation_kwh: 1350, factory_load_kwh: 1420 },
    { date: 'Wed', solar_generation_kwh: 900, factory_load_kwh: 1480 },
    { date: 'Thu', solar_generation_kwh: 1400, factory_load_kwh: 1400 },
    { date: 'Fri', solar_generation_kwh: 1420, factory_load_kwh: 1410 },
    { date: 'Sat', solar_generation_kwh: 1380, factory_load_kwh: 1350 },
    { date: 'Sun', solar_generation_kwh: 1450, factory_load_kwh: 1200 },
  ], []);

  // Calculate current average OEE from mock data
  const currentOEE = useMemo(() => Math.round(oeeData.reduce((acc, curr) => acc + curr.oee, 0) / oeeData.length), [oeeData]);

  return (
    <div className="p-6 space-y-6 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-slate-800">Shift Analytics & OEE</h2>
        <div className="bg-white px-4 py-2 rounded shadow text-sm font-semibold text-slate-600 border border-slate-200">
          Last 7 Days
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* OEE Gauge / Summary */}
        <div className="bg-white p-6 rounded-lg shadow border border-slate-200 flex flex-col items-center justify-center min-h-[250px]">
          <h3 className="text-lg font-semibold text-slate-700 mb-4">Overall Equipment Effectiveness</h3>
          <div className="relative w-48 h-48 flex items-center justify-center rounded-full border-[12px] border-emerald-500">
             <div className="text-5xl font-black text-slate-800">{currentOEE}%</div>
          </div>
          <div className="mt-6 w-full flex justify-between text-sm text-slate-600 px-4">
            <div className="text-center">
               <div className="font-bold text-slate-800">89%</div>
               <div>Availability</div>
            </div>
            <div className="text-center">
               <div className="font-bold text-slate-800">96%</div>
               <div>Performance</div>
            </div>
            <div className="text-center">
               <div className="font-bold text-slate-800">100%</div>
               <div>Quality</div>
            </div>
          </div>
        </div>

        {/* Downtime Pareto */}
        <div className="bg-white p-6 rounded-lg shadow border border-slate-200 col-span-1 md:col-span-2 min-h-[250px]">
          <h3 className="text-lg font-semibold text-slate-700 mb-4">Downtime Pareto (Minutes Lost)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paretoData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="reason" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="minutes" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Energy Offset Chart */}
        <div className="bg-white p-6 rounded-lg shadow border border-slate-200 min-h-[300px]">
          <h3 className="text-lg font-semibold text-slate-700 mb-4">Huawei Solar Generation vs Factory Load (kWh)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={energyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSolar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" />
                <Area type="monotone" dataKey="solar_generation_kwh" name="Solar Generation" stroke="#10b981" fillOpacity={1} fill="url(#colorSolar)" strokeWidth={3} />
                <Line type="monotone" dataKey="factory_load_kwh" name="Factory Load" stroke="#64748b" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
};

