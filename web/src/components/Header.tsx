"use client";
import React, { useState, useEffect } from 'react';
import { useTelemetry } from '../contexts/TelemetryContext';
import { Activity, Menu, MessageSquare, Calendar, Gauge, Wind, Scissors, RotateCw, Lock, AlignJustify, Home, BarChart2 } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter, usePathname } from 'next/navigation';

export const Header: React.FC = () => {
  const { looms, selectedLoom, setSelectedLoom, mockMode } = useTelemetry();
  const [time, setTime] = useState(new Date());
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loom = typeof selectedLoom === 'number' ? looms[selectedLoom] : null;
  const isStopped = loom?.status.startsWith('STOPPED');
  
  // Dummy data for visual replication
  const articleStr = `80x80=90x74=48x2 loom no ${selectedLoom === 'GLOBAL' ? 'ALL' : selectedLoom}`;
  const rpm = loom ? loom.rpm : 0;
  const airConsumption = "74.4"; // Mocked static to match image
  const stopDuration = isStopped ? "0:02:22" : "0:00:00"; // For realism, we'd sync this with downtime ticker
  const angle = "135.8°";

  return (
    <header className="flex items-center justify-between bg-[#1e293b] text-slate-100 px-4 py-2 border-b-2 border-[#1e293b] shadow-md h-14">
      {/* Left Group */}
      <div className="flex items-center gap-6 h-full">
        <button className="text-slate-300 hover:text-white p-1">
          <Menu size={24} />
        </button>
        <div className="h-8">
          <img src="/logo.png" alt="Ali Haider Industries" className="h-full object-contain filter invert brightness-0" style={{ filter: 'brightness(0) invert(1)' }} />
        </div>
        <button className="text-slate-300 hover:text-white p-1">
          <MessageSquare size={20} />
        </button>
        <button className="text-slate-300 hover:text-white p-1">
          <Calendar size={20} />
        </button>
            <button 
              onClick={() => router.push('/')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md font-medium text-sm transition-colors ${pathname === '/' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
            >
              <Activity size={18} /> Global Dashboard
            </button>
            <button 
              onClick={() => router.push('/analytics')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md font-medium text-sm transition-colors ${pathname === '/analytics' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
            >
              <BarChart2 size={18} /> Analytics
            </button>
        
        {/* Active View Title */}
        <div className="text-sm font-medium px-2 py-1 text-slate-200">
          {pathname === '/analytics' 
            ? 'Historical Analytics & OEE' 
            : selectedLoom === 'GLOBAL' 
              ? 'Factory Overview (36 Looms)' 
              : `80x80=90x74=48x2 loom no ${selectedLoom}`}
        </div>
      </div>

      {/* Center Group (Metrics) */}
      <div className="flex items-center gap-8 text-sm">
        <div className="flex flex-col items-center leading-tight">
          <div className="flex items-center gap-1 font-bold text-white">
             <Gauge size={16} className="text-slate-400" /> {rpm} <span className="text-xs font-normal text-slate-400">rpm</span>
          </div>
          <div className="flex items-center gap-1 font-bold text-white">
             <Wind size={14} className="text-slate-400" /> {airConsumption} <span className="text-[10px] font-normal text-slate-400">Nm³/h</span>
          </div>
        </div>

        {loom && (
            <div className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                    <Scissors size={20} className={isStopped ? 'text-red-400' : 'text-slate-500'} />
                    {isStopped && <span className="text-xs font-mono">{stopDuration}</span>}
                </div>
            </div>
        )}

        <div className="flex items-center gap-1 font-bold text-white text-lg">
           <RotateCw size={18} className="text-slate-400" /> {angle}
        </div>
      </div>

      {/* Right Group (Time/Settings) */}
      <div className="flex items-center gap-6">
        <div className="flex flex-col items-end leading-tight font-medium text-slate-200">
          <div className="text-sm">{format(time, 'hh:mm a')}</div>
          <div className="text-xs text-slate-400">{format(time, 'dd/MM/yyyy')}</div>
        </div>
        <button className="text-slate-300 hover:text-white p-1">
          <Lock size={20} />
        </button>
        <button className="text-slate-300 hover:text-white p-1">
          <AlignJustify size={20} />
        </button>
      </div>
      
      {mockMode && (
         <div className="absolute top-0 right-0 text-[8px] text-amber-500 font-mono">MOCK</div>
      )}
    </header>
  );
};

