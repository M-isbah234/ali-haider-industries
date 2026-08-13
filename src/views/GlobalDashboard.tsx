"use client";
import React from 'react';
import { useTelemetry } from '../contexts/TelemetryContext';
import { Factory, Activity } from 'lucide-react';
import { KpiCard } from '../components/ui/KpiCard';
import { AmbientSensorWidget } from '../components/ui/AmbientSensorWidget';
import { MachineMatrixGrid } from '../components/ui/MachineMatrixGrid';

export const GlobalDashboard: React.FC = () => {
  const { looms, ambient, setSelectedLoom } = useTelemetry();

  const totalLooms = Object.keys(looms).length || 36;
  const runningLooms = Object.values(looms).filter(l => l.status === 'RUNNING').length;
  const stoppedLooms = totalLooms - runningLooms;
  const avgEfficiency = Object.values(looms).length > 0 
      ? Object.values(looms).reduce((acc, l) => acc + l.efficiency, 0) / Object.values(looms).length 
      : 0;

  return (
    <div className="p-4 sm:p-6 h-[calc(100vh-56px)] overflow-y-auto bg-[#e8ebf0]">
      
      {/* Header Title */}
      <div className="flex items-center gap-3 mb-6">
        <Factory size={28} className="text-slate-700" />
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Factory Floor Overview</h1>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <KpiCard 
          title="Total Efficiency" 
          value={`${avgEfficiency.toFixed(1)}%`} 
        />
        <KpiCard 
          title="Running Looms" 
          value={runningLooms} 
          subtitle={`/ ${totalLooms}`} 
          valueColor="text-emerald-600"
        />
        <KpiCard 
          title="Stopped Looms" 
          value={stoppedLooms} 
          valueColor="text-red-500"
        />
        <AmbientSensorWidget ambient={ambient} />
      </div>

      {/* Loom Grid */}
      <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
        <Activity size={20} /> Machine Matrix
      </h2>
      
      <MachineMatrixGrid looms={looms} onSelectLoom={setSelectedLoom} />
      
    </div>
  );
};
