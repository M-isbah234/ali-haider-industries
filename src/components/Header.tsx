"use client";
import React, { useState, useEffect } from 'react';
import { useTelemetry } from '../contexts/TelemetryContext';
import { Activity, Menu, MessageSquare, Calendar, Gauge, Wind, Scissors, RotateCw, Lock, AlignJustify, BarChart2, Thermometer, Droplets } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter, usePathname } from 'next/navigation';
import toast from 'react-hot-toast';
import { getEffectiveLoomStatusConfig } from '../types';

export const Header: React.FC = () => {
  const { looms, ambient, selectedLoom, setSelectedLoom, mockMode } = useTelemetry();
  const [time, setTime] = useState(new Date());
  const [airConsumption, setAirConsumption] = useState("74.4");
  const [angle, setAngle] = useState("135.8°");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
      setAirConsumption((74.0 + Math.random() * 0.8).toFixed(1));
      setAngle((135.0 + Math.random() * 1.5).toFixed(1) + '°');
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loom = typeof selectedLoom === 'number' ? looms[selectedLoom] : null;
  const isStopped = loom?.status.startsWith('STOPPED');

  // Factory summary metrics
  const loomArray = Object.values(looms);
  const totalLooms = 36;
  const runningLooms = loomArray.filter(
    (l) => getEffectiveLoomStatusConfig(l).key === 'RUNNING'
  ).length;
  const stoppedLooms = totalLooms - runningLooms;
  const avgEfficiency =
    loomArray.length > 0
      ? loomArray.reduce((acc, l) => acc + (l.efficiency || 0), 0) / loomArray.length
      : 0;

  // Ambient metrics
  const temp = ambient?.hall_temperature_celsius ?? 28.0;
  const humidity = ambient?.hall_humidity_percentage ?? 65.0;
  const pressure = ambient?.main_air_pressure_bar ?? 7.1;

  const avgRpm = Object.values(looms).filter(l => l.status === 'RUNNING').length > 0
    ? Object.values(looms).filter(l => l.status === 'RUNNING').reduce((acc, l) => acc + l.rpm, 0) / Object.values(looms).filter(l => l.status === 'RUNNING').length
    : 0;
  const rpm = loom ? loom.rpm : Math.round(avgRpm);

  const stopDuration = isStopped ? "0:02:22" : "0:00:00";

  // Only show global factory metrics when on global view
  const isGlobalView = selectedLoom === 'GLOBAL';

  return (
    <header className="flex items-center justify-between bg-[#1e293b] text-slate-100 px-4 py-0 border-b-2 border-[#1e293b] shadow-md h-14 gap-3">

      {/* ── Left Group: Nav ── */}
      <div className="flex items-center gap-3 h-full shrink-0">
        <button
          onClick={() => { setSelectedLoom('GLOBAL'); router.push('/'); toast.success('Switched to Main Factory Overview'); }}
          className="text-slate-300 hover:text-white p-1 transition-colors cursor-pointer"
          title="Factory Navigation"
        >
          <Menu size={22} />
        </button>
        <div
          onClick={() => { setSelectedLoom('GLOBAL'); router.push('/'); }}
          className="h-7 cursor-pointer shrink-0"
          title="Ali Haider Industries Dashboard Home"
        >
          <img src="/logo.png" alt="Ali Haider Industries" className="h-full object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
        </div>
        <button
          onClick={() => toast.success('Telemetry Notification Center: All systems operational. 2 Oil maintenance alerts active.')}
          className="text-slate-300 hover:text-white p-1 transition-colors cursor-pointer relative"
          title="System Notifications"
        >
          <MessageSquare size={19} />
          <span className="absolute top-0 right-0 w-2 h-2 bg-amber-500 rounded-full animate-ping" />
        </button>
        <button
          onClick={() => toast.success(`Current Shift: Morning Shift (08:00 - 16:00) | Date: ${format(time, 'dd/MM/yyyy')}`)}
          className="text-slate-300 hover:text-white p-1 transition-colors cursor-pointer"
          title="Shift Schedule"
        >
          <Calendar size={19} />
        </button>
        <button
          onClick={() => { setSelectedLoom('GLOBAL'); router.push('/'); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold text-xs transition-colors cursor-pointer ${pathname === '/' && selectedLoom === 'GLOBAL' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
        >
          <Activity size={16} /> Global Dashboard
        </button>
        <button
          onClick={() => router.push('/analytics')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold text-xs transition-colors cursor-pointer ${pathname === '/analytics' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
        >
          <BarChart2 size={16} /> Analytics
        </button>
        <div className="text-xs font-extrabold px-2 py-1 text-slate-200 bg-slate-800/80 rounded border border-slate-700 shrink-0">
          {pathname === '/analytics'
            ? 'Historical Analytics & OEE'
            : selectedLoom === 'GLOBAL'
              ? 'Factory Floor (36 Looms)'
              : `Loom ${selectedLoom} Telemetry`}
        </div>
      </div>

      {/* ── Center Group: Factory + Ambient Metrics (global view only) + Machine Metrics ── */}
      <div className="flex items-center gap-1 flex-1 justify-center min-w-0">

        {/* Divider */}
        <div className="h-8 w-px bg-slate-700 mx-1 shrink-0" />

        {/* Factory Summary — only on global view */}
        {isGlobalView && (
          <>
            <div className="flex flex-col items-center leading-none px-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Efficiency</span>
              <span className="text-sm font-mono font-black text-white">{avgEfficiency.toFixed(1)}%</span>
            </div>
            <div className="h-7 w-px bg-slate-700 shrink-0" />
            <div className="flex flex-col items-center leading-none px-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Running</span>
              <span className="text-sm font-mono font-black">
                <span className="text-emerald-400">{runningLooms}</span>
                <span className="text-slate-500 font-normal text-xs">/{totalLooms}</span>
              </span>
            </div>
            <div className="h-7 w-px bg-slate-700 shrink-0" />
            <div className="flex flex-col items-center leading-none px-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Stopped</span>
              <span className="text-sm font-mono font-black text-red-400">{stoppedLooms}</span>
            </div>
            <div className="h-8 w-px bg-slate-700 mx-1 shrink-0" />
          </>
        )}

        {/* Ambient sensors — always visible */}
        <div className="flex flex-col items-center leading-none px-2">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Temp</span>
          <span className="flex items-center gap-1 text-sm font-mono font-black text-rose-300">
            <Thermometer size={12} className="text-rose-400" />
            {temp.toFixed(1)}°C
          </span>
        </div>
        <div className="h-7 w-px bg-slate-700 shrink-0" />
        <div className="flex flex-col items-center leading-none px-2">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Humidity</span>
          <span className="flex items-center gap-1 text-sm font-mono font-black text-blue-300">
            <Droplets size={12} className="text-blue-400" />
            {humidity.toFixed(1)}%
          </span>
        </div>
        <div className="h-7 w-px bg-slate-700 shrink-0" />
        <div className="flex flex-col items-center leading-none px-2">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Air Press.</span>
          <span className={`flex items-center gap-1 text-sm font-mono font-black ${pressure < 5.5 ? 'text-amber-400' : 'text-emerald-300'}`}>
            <Gauge size={12} className={pressure < 5.5 ? 'text-amber-400' : 'text-emerald-400'} />
            {pressure.toFixed(1)} Bar
          </span>
        </div>

        <div className="h-8 w-px bg-slate-700 mx-1 shrink-0" />

        {/* Machine metrics — always visible */}
        <div className="flex flex-col items-center leading-none px-2">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Speed</span>
          <span className="flex items-center gap-1 text-sm font-mono font-black text-white">
            <Gauge size={12} className="text-slate-400" />
            {rpm} <span className="text-[9px] font-normal text-slate-400">rpm</span>
          </span>
        </div>
        <div className="h-7 w-px bg-slate-700 shrink-0" />
        <div className="flex flex-col items-center leading-none px-2">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Air Flow</span>
          <span className="flex items-center gap-1 text-sm font-mono font-black text-white">
            <Wind size={12} className="text-slate-400" />
            {airConsumption} <span className="text-[9px] font-normal text-slate-400">Nm³/h</span>
          </span>
        </div>
        <div className="h-7 w-px bg-slate-700 shrink-0" />
        <div className="flex flex-col items-center leading-none px-2">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Angle</span>
          <span className="flex items-center gap-1 text-sm font-mono font-black text-white">
            <RotateCw size={12} className="text-slate-400" />
            {angle}
          </span>
        </div>

        {loom && isStopped && (
          <>
            <div className="h-7 w-px bg-slate-700 shrink-0 mx-1" />
            <div className="flex flex-col items-center leading-none px-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Downtime</span>
              <span className="flex items-center gap-1 text-sm font-mono font-black text-red-400">
                <Scissors size={12} className="text-red-400" />
                {stopDuration}
              </span>
            </div>
          </>
        )}
      </div>

      {/* ── Right Group: Time / Settings ── */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex flex-col items-end leading-tight font-medium text-slate-200">
          <div className="text-xs font-bold text-white">{format(time, 'hh:mm:ss a')}</div>
          <div className="text-[10px] text-slate-400 font-mono">{format(time, 'dd/MM/yyyy')}</div>
        </div>
        <button
          onClick={() => toast.success('Telemetry Control Lock: Operator mode active')}
          className="text-slate-300 hover:text-white p-1 transition-colors cursor-pointer"
          title="Security Lock State"
        >
          <Lock size={18} />
        </button>
        <button
          onClick={() => toast.success('System Configuration: Edge Gateway connected to Supabase & Live Mock Telemetry')}
          className="text-slate-300 hover:text-white p-1 transition-colors cursor-pointer"
          title="System Settings"
        >
          <AlignJustify size={18} />
        </button>
      </div>

      {mockMode && (
        <div className="absolute top-0 right-0 text-[8px] text-amber-500 font-mono">MOCK</div>
      )}
    </header>
  );
};
