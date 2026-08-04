"use client";
import React from 'react';
import { useTelemetry } from '../contexts/TelemetryContext';
import { Thermometer, Droplets, Gauge, Factory, Activity } from 'lucide-react';

export const GlobalDashboard: React.FC = () => {
  const { looms, ambient, setSelectedLoom } = useTelemetry();

  const totalLooms = Object.keys(looms).length || 36;
  const runningLooms = Object.values(looms).filter(l => l.status === 'RUNNING').length;
  const stoppedLooms = totalLooms - runningLooms;
  const avgEfficiency = Object.values(looms).length > 0 
      ? Object.values(looms).reduce((acc, l) => acc + l.efficiency, 0) / Object.values(looms).length 
      : 0;

  return (
    <div className="p-6 h-[calc(100vh-56px)] overflow-y-auto bg-[#e8ebf0]">
      
      {/* Header Title */}
      <div className="flex items-center gap-3 mb-6">
        <Factory size={28} className="text-slate-700" />
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Factory Floor Overview</h1>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-slate-300 shadow-sm p-6 rounded-xl flex flex-col justify-center">
           <div className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Total Efficiency</div>
           <div className="text-4xl font-mono font-bold text-blue-600">{avgEfficiency.toFixed(1)}%</div>
        </div>
        <div className="bg-white border border-slate-300 shadow-sm p-6 rounded-xl flex flex-col justify-center">
           <div className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Running Looms</div>
           <div className="text-4xl font-mono font-bold text-emerald-600">{runningLooms} <span className="text-2xl text-slate-400">/ {totalLooms}</span></div>
        </div>
        <div className="bg-white border border-slate-300 shadow-sm p-6 rounded-xl flex flex-col justify-center">
           <div className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Stopped Looms</div>
           <div className="text-4xl font-mono font-bold text-red-500">{stoppedLooms}</div>
        </div>
        
        {/* Ambient Sensors */}
        <div className="bg-[#1e293b] p-5 rounded-xl shadow-md flex flex-col justify-between text-slate-200">
           <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Ambient Sensors</div>
           <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm"><Thermometer size={16}/> Temp</span>
              <span className="font-mono font-bold">{ambient?.hall_temperature_celsius.toFixed(1)}°C</span>
           </div>
           <div className="flex items-center justify-between mt-1">
              <span className="flex items-center gap-2 text-sm"><Droplets size={16}/> Humidity</span>
              <span className="font-mono font-bold text-blue-300">{ambient?.hall_humidity_percentage.toFixed(1)}%</span>
           </div>
           <div className="flex items-center justify-between mt-1">
              <span className="flex items-center gap-2 text-sm"><Gauge size={16}/> Air Press.</span>
              <span className="font-mono font-bold text-emerald-300">{ambient?.main_air_pressure_bar.toFixed(1)} Bar</span>
           </div>
        </div>
      </div>

      {/* Loom Grid */}
      <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
        <Activity size={20} /> Machine Matrix
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 pb-8">
        {Object.values(looms).sort((a,b) => a.loom_number - b.loom_number).map(loom => {
          const isRunning = loom.status === 'RUNNING';
          const borderColor = isRunning ? 'border-emerald-500' : 'border-red-500';
          const indicatorColor = isRunning ? 'bg-emerald-500' : 'bg-red-500 animate-pulse';
          const textColor = isRunning ? 'text-emerald-700' : 'text-red-600';
          const bgHover = isRunning ? 'hover:bg-emerald-50' : 'hover:bg-red-50';
          
          return (
            <button 
              key={loom.loom_number}
              onClick={() => setSelectedLoom(loom.loom_number)}
              className={`text-left bg-white p-3 rounded-lg border-l-4 shadow-sm transition-all duration-150 cursor-pointer ${borderColor} ${bgHover} border-t border-r border-b border-y-slate-200 border-r-slate-200 hover:shadow-md transform hover:-translate-y-0.5`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-slate-800">Loom {loom.loom_number}</span>
                <span className={`w-3 h-3 rounded-full mt-1 ${indicatorColor}`}></span>
              </div>
              <div className="text-xl font-mono font-bold text-slate-700">
                {loom.efficiency.toFixed(1)}%
              </div>
              <div className="flex justify-between items-end mt-2">
                  <div className="text-xs text-slate-500 font-mono">{loom.rpm} RPM</div>
                  <div className={`text-[10px] font-bold uppercase tracking-widest ${textColor}`}>
                     {isRunning ? 'Run' : 'Stop'}
                  </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

