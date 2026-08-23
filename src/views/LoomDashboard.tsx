"use client";
import React, { useState, useEffect } from 'react';
import { useTelemetry } from '../contexts/TelemetryContext';
import { Activity, Cloud, List, Stethoscope, Power, Settings, ArrowLeft, Wrench, Clock, AlertTriangle, CheckCircle2, Save, RotateCcw, ShieldAlert, Gauge } from 'lucide-react';
import { SensorDashboard } from '../components/omniplus/SensorDashboard';
import { ClimateMonitoring } from '../components/omniplus/ClimateMonitoring';
import { ActionCenter } from '../components/omniplus/ActionCenter';
import { getLoomModel, getOilStatus, getEffectiveLoomStatusConfig } from '../types';
import { useRouter } from 'next/navigation';

type Tab = 'sensors' | 'climate' | 'logs' | 'oil';

export const LoomDashboard: React.FC = () => {
  const { looms, selectedLoom, setSelectedLoom, updateLoomOilSettings, resetOilChange } = useTelemetry();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('sensors');

  const loom = typeof selectedLoom === 'number' ? looms[selectedLoom] : null;

  // Oil Change form states
  const [targetHours, setTargetHours] = useState<number>(5000);
  const [lastDate, setLastDate] = useState<string>('');
  const [lastHours, setLastHours] = useState<number>(0);
  const [warningThreshold, setWarningThreshold] = useState<number>(200);

  useEffect(() => {
    if (loom) {
      setTargetHours(loom.oil_target_hours || 5000);
      setLastDate(loom.oil_last_date || new Date().toISOString().split('T')[0]);
      setLastHours(loom.oil_last_hours || 0);
      setWarningThreshold(loom.oil_warning_threshold || 200);
    }
  }, [loom?.loom_number]);

  if (!loom) return <div className="p-8 text-slate-800">Select a loom...</div>;

  const model = getLoomModel(loom.loom_number);
  const oilStatus = getOilStatus(loom);
  const statusConfig = getEffectiveLoomStatusConfig(loom);

  const hoursUsed = oilStatus.hoursSinceChange;
  const progressPercent = Math.min(100, Math.max(0, (hoursUsed / (loom.oil_target_hours || 5000)) * 100));

  const handleSaveOilSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateLoomOilSettings(loom.loom_number, {
      targetHours: Number(targetHours),
      lastDate,
      lastHours: Number(lastHours),
      warningThreshold: Number(warningThreshold),
    });
  };

  const handleResetOilCounter = () => {
    resetOilChange(loom.loom_number);
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'sensors', label: 'Telemetry / Real-Time Overview', icon: <Activity size={16} /> },
    { key: 'climate', label: 'Climate Control', icon: <Cloud size={16} /> },
    { key: 'logs',    label: 'Action Center',   icon: <List size={16} /> },
    { key: 'oil',     label: 'Oil Change & Maintenance', icon: <Wrench size={16} /> },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] bg-[#e8ebf0]">

      {/* OmniPlus-i Connect Navigation Bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-300 bg-white shadow-xs flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setSelectedLoom('GLOBAL');
              router.push('/');
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-extrabold text-xs bg-slate-800 text-white hover:bg-slate-900 shadow-2xs transition-colors cursor-pointer mr-2"
          >
            <ArrowLeft size={16} /> Factory Floor Overview
          </button>

          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-xs shadow-2xs transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white border border-blue-600'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.key === 'oil' && (oilStatus.state === 'OVERDUE' || oilStatus.state === 'DUE') && (
                <span className={`ml-1 text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                  oilStatus.state === 'OVERDUE' ? 'bg-amber-900 text-white animate-pulse' : 'bg-amber-400 text-amber-950'
                }`}>
                  {oilStatus.state === 'OVERDUE' ? '⚠️ OVERDUE' : '! DUE'}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="text-slate-800 text-sm font-bold">
            Machine {loom.loom_number < 10 ? `0${loom.loom_number}` : loom.loom_number}{' '}
            <span className="font-extrabold text-xs uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300 ml-1">
              {model}
            </span>
          </div>
          <button className="p-2 bg-white text-slate-600 hover:bg-slate-50 transition-colors rounded-lg border border-slate-200 shadow-2xs">
            <Settings size={18} />
          </button>
          <button className="p-2 bg-white text-slate-600 hover:bg-slate-50 transition-colors rounded-lg border border-slate-200 shadow-2xs">
            <Stethoscope size={18} />
          </button>
          <button className="p-2 bg-white text-slate-600 hover:bg-slate-50 transition-colors rounded-lg border border-slate-200 shadow-2xs flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${loom.status !== 'RUNNING' ? 'bg-red-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
            <Power size={18} className={loom.status !== 'RUNNING' ? 'text-red-500' : 'text-emerald-500'} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-[#e8ebf0]">
        {activeTab === 'sensors' && <SensorDashboard />}
        {activeTab === 'climate' && <ClimateMonitoring />}
        {activeTab === 'logs' && <ActionCenter />}

        {/* ── Oil Change & Maintenance Sub-Panel ── */}
        {activeTab === 'oil' && (
          <div className="space-y-4 max-w-4xl mx-auto mt-4">

            {/* Overdue Banner */}
            {oilStatus.state === 'OVERDUE' && (
              <div className="bg-[#D2B48C] border-2 border-[#8B5A2B] text-amber-950 p-4 rounded-xl shadow flex items-start gap-3 animate-pulse">
                <ShieldAlert size={26} className="text-amber-950 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-black text-sm uppercase tracking-wide flex items-center gap-1.5">
                    ⚠️ OIL CHANGE OVERDUE
                  </h4>
                  <p className="text-xs font-semibold mt-0.5 leading-relaxed">
                    Machine runtime has exceeded the target oil change interval by{' '}
                    <span className="underline font-black">{Math.abs(oilStatus.hoursRemaining).toFixed(1)} hours</span>! Replace machine oil immediately to prevent mechanical damage.
                  </p>
                </div>
              </div>
            )}

            {/* Due Soon Banner */}
            {oilStatus.state === 'DUE' && (
              <div className="bg-[#F5E6D3] border border-[#D2B48C] text-amber-900 p-4 rounded-xl shadow-xs flex items-start gap-3">
                <AlertTriangle size={24} className="text-amber-700 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-black text-sm uppercase tracking-wide">
                    ⚡ OIL CHANGE DUE SOON
                  </h4>
                  <p className="text-xs font-semibold mt-0.5 leading-relaxed">
                    Oil maintenance threshold reached. Only{' '}
                    <span className="font-black text-amber-950">{oilStatus.hoursRemaining.toFixed(1)} hours remaining</span> before target interval expiry.
                  </p>
                </div>
              </div>
            )}

            {/* OK Banner */}
            {oilStatus.state === 'NORMAL' && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-xl flex items-center gap-3">
                <CheckCircle2 size={22} className="text-emerald-600 shrink-0" />
                <span className="text-sm font-bold">Oil level nominal — no action required.</span>
              </div>
            )}

            {/* Live Counters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Cumulative Runtime */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
                  <span>Live Cumulative Runtime</span>
                  <Clock size={16} className="text-blue-600" />
                </div>
                <div>
                  <span className="text-2xl font-mono font-black text-slate-900">
                    {loom.running_hours.toFixed(1)}
                  </span>
                  <span className="text-xs font-bold text-slate-500 ml-1">Hours</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-1">Telemetry active</div>
              </div>

              {/* Runtime Since Oil Change */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
                  <span>Runtime Since Oil Change</span>
                  <Wrench size={16} className="text-amber-600" />
                </div>
                <div>
                  <span className="text-2xl font-mono font-black text-slate-900">
                    {hoursUsed.toFixed(1)}
                  </span>
                  <span className="text-xs font-bold text-slate-500 ml-1">/ {loom.oil_target_hours} hrs</span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden border border-slate-200">
                  <div
                    className={`h-full transition-all duration-300 ${
                      oilStatus.state === 'OVERDUE'
                        ? 'bg-[#8B5A2B]'
                        : oilStatus.state === 'DUE'
                        ? 'bg-[#D2B48C]'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Machine Speed */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
                  <span>Machine Speed & Efficiency</span>
                  <Gauge size={16} className="text-emerald-600" />
                </div>
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-mono font-black text-slate-900">{loom.rpm}</span>
                    <span className="text-xs font-bold text-slate-500 ml-1">RPM</span>
                  </div>
                  <span className="text-lg font-mono font-black text-emerald-600">
                    {loom.efficiency.toFixed(1)}%
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-1">
                  Picks: {loom.total_picks.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Oil Maintenance Configuration Panel */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-100/90 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                  <Wrench size={16} className="text-amber-600" /> Oil Maintenance Configuration
                </h3>
                <button
                  type="button"
                  onClick={handleResetOilCounter}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <RotateCcw size={14} /> Record Oil Change Now
                </button>
              </div>

              <form onSubmit={handleSaveOilSettings} className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Target Interval */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      Target Oil Change Interval (Hours)
                    </label>
                    <input
                      type="number"
                      value={targetHours}
                      onChange={(e) => setTargetHours(Number(e.target.value))}
                      min={100}
                      max={20000}
                      step={50}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono font-bold text-slate-900 bg-slate-50"
                      placeholder="e.g. 5000"
                    />
                    <span className="text-[10px] text-slate-500 font-medium">Standard interval (e.g. 5000 hrs)</span>
                  </div>

                  {/* Warning Threshold */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      Warning Threshold (Hours)
                    </label>
                    <input
                      type="number"
                      value={warningThreshold}
                      onChange={(e) => setWarningThreshold(Number(e.target.value))}
                      min={10}
                      max={1000}
                      step={10}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono font-bold text-slate-900 bg-slate-50"
                      placeholder="e.g. 200"
                    />
                    <span className="text-[10px] text-slate-500 font-medium">Triggers tan warning when within threshold</span>
                  </div>

                  {/* Last Change Date */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      Last Oil Change Date
                    </label>
                    <input
                      type="date"
                      value={lastDate}
                      onChange={(e) => setLastDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono font-bold text-slate-900 bg-slate-50"
                    />
                  </div>

                  {/* Last Change Running Hours */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      Last Change Machine Running Hours
                    </label>
                    <input
                      type="number"
                      value={lastHours}
                      onChange={(e) => setLastHours(Number(e.target.value))}
                      min={0}
                      step={1}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono font-bold text-slate-900 bg-slate-50"
                      placeholder="e.g. 1200"
                    />
                    <span className="text-[10px] text-slate-500 font-medium">Machine hour counter at last oil service</span>
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-200">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                  >
                    <Save size={16} /> Save Configuration
                  </button>
                </div>
              </form>
            </div>

            {/* Status Footer */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full animate-pulse ${
                  oilStatus.state === 'OVERDUE' ? 'bg-amber-900' :
                  oilStatus.state === 'DUE'     ? 'bg-amber-400' :
                  'bg-emerald-500'
                }`} />
                <span className="text-sm font-semibold text-slate-700">
                  Oil Status:{' '}
                  <span className={`font-black ${
                    oilStatus.state === 'OVERDUE' ? 'text-amber-900' :
                    oilStatus.state === 'DUE'     ? 'text-amber-600' :
                    'text-emerald-700'
                  }`}>
                    {oilStatus.state === 'OVERDUE' ? 'OVERDUE — Immediate action required' :
                     oilStatus.state === 'DUE'     ? `DUE — ${oilStatus.hoursRemaining.toFixed(0)} hrs remaining` :
                     `NORMAL — ${oilStatus.hoursRemaining.toFixed(0)} hrs until next change`}
                  </span>
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono hidden sm:block">
                Loom ID: {loom.loom_id || `loom-${loom.loom_number}`}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
