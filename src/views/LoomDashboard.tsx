"use client";
import React, { useState } from 'react';
import { useTelemetry } from '../contexts/TelemetryContext';
import { Activity, Cloud, List, Stethoscope, Power, Settings } from 'lucide-react';
import { SensorDashboard } from '../components/omniplus/SensorDashboard';
import { ClimateMonitoring } from '../components/omniplus/ClimateMonitoring';
import { ActionCenter } from '../components/omniplus/ActionCenter';

type Tab = 'sensors' | 'climate' | 'logs';

export const LoomDashboard: React.FC = () => {
  const { looms, selectedLoom } = useTelemetry();
  const [activeTab, setActiveTab] = useState<Tab>('sensors');

  const loom = typeof selectedLoom === 'number' ? looms[selectedLoom] : null;

  if (!loom) return <div className="p-8 text-slate-800">Select a loom...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] bg-[#e8ebf0]">
      
      {/* OmniPlus-i Connect Navigation Bar */}
      <div className="flex items-center justify-between p-3 border-b border-slate-300 bg-white shadow-sm">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveTab('sensors')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm shadow-sm transition-colors ${activeTab === 'sensors' ? 'bg-blue-600 text-white border border-blue-600' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            <Activity size={18} /> Sensor Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('climate')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm shadow-sm transition-colors ${activeTab === 'climate' ? 'bg-blue-600 text-white border border-blue-600' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            <Cloud size={18} /> Climate Control
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm shadow-sm transition-colors ${activeTab === 'logs' ? 'bg-blue-600 text-white border border-blue-600' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            <List size={18} /> Action Center
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-slate-800 text-sm font-bold mr-4">
            Machine {loom.loom_number} <span className="font-normal text-slate-500">| OmniPlus-i Connect</span>
          </div>
          <button className="p-2 bg-white text-slate-600 hover:bg-slate-50 transition-colors rounded-lg border border-slate-200 shadow-sm">
              <Settings size={18} />
          </button>
          <button className="p-2 bg-white text-slate-600 hover:bg-slate-50 transition-colors rounded-lg border border-slate-200 shadow-sm">
              <Stethoscope size={18} />
          </button>
          <button className="p-2 bg-white text-slate-600 hover:bg-slate-50 transition-colors rounded-lg border border-slate-200 shadow-sm flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${loom.status.startsWith('STOPPED') ? 'bg-red-500 animate-pulse' : 'bg-green-500 animate-pulse'}`}></span>
              <Power size={18} className={loom.status.startsWith('STOPPED') ? 'text-red-500' : 'text-emerald-500'} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-[#e8ebf0]">
        {activeTab === 'sensors' && <SensorDashboard />}
        {activeTab === 'climate' && <ClimateMonitoring />}
        {activeTab === 'logs' && <ActionCenter />}
      </div>
    </div>
  );
};

