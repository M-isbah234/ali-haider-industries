import React, { useState, useEffect } from 'react';
import { LoomState, getLoomModel, getOilStatus, getEffectiveLoomStatusConfig } from '../../types';
import { useTelemetry } from '../../contexts/TelemetryContext';
import { X, Wrench, Clock, AlertTriangle, CheckCircle2, Save, RotateCcw, Activity, Gauge, ShieldAlert, Cpu } from 'lucide-react';

interface LoomDetailModalProps {
  loomNumber: number;
  onClose: () => void;
  onNavigateToFullView?: (loomNumber: number) => void;
}

export const LoomDetailModal: React.FC<LoomDetailModalProps> = ({
  loomNumber,
  onClose,
  onNavigateToFullView,
}) => {
  const { looms, updateLoomOilSettings, resetOilChange } = useTelemetry();
  const loom = looms[loomNumber];

  const model = getLoomModel(loomNumber);

  // Form states for manual interval settings
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
  }, [loom]);

  if (!loom) return null;

  const oilStatus = getOilStatus(loom);
  const statusConfig = getEffectiveLoomStatusConfig(loom);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateLoomOilSettings(loomNumber, {
      targetHours: Number(targetHours),
      lastDate,
      lastHours: Number(lastHours),
      warningThreshold: Number(warningThreshold),
    });
  };

  const handleResetCounter = () => {
    resetOilChange(loomNumber);
  };

  // Progress percentage of oil life used
  const hoursUsed = oilStatus.hoursSinceChange;
  const progressPercent = Math.min(100, Math.max(0, (hoursUsed / (loom.oil_target_hours || 5000)) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200"
          style={{ backgroundColor: statusConfig.bgHex }}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-xl border font-mono font-black text-lg shadow-2xs"
              style={{ backgroundColor: statusConfig.bgHex, borderColor: statusConfig.accentHex }}
            >
              Loom {loom.loom_number < 10 ? `0${loom.loom_number}` : loom.loom_number}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-slate-900">
                  Loom {loom.loom_number} Details
                </h2>
                <span className="text-xs font-black uppercase px-2 py-0.5 rounded-full bg-slate-800 text-white shadow-2xs">
                  {model}
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                Live Status:{' '}
                <span className={`font-extrabold ${statusConfig.textClass}`}>
                  {statusConfig.label} ({statusConfig.badgeText})
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/80 text-slate-600 hover:text-slate-900 hover:bg-white border border-slate-300 transition-all cursor-pointer shadow-2xs"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#f8fafc]">
          {/* Persistent Warning Banner */}
          {oilStatus.state === 'OVERDUE' && (
            <div className="bg-[#D2B48C] border-2 border-[#8B5A2B] text-amber-950 p-3.5 rounded-xl shadow-sm flex items-start gap-3 animate-pulse">
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

          {oilStatus.state === 'DUE' && (
            <div className="bg-[#F5E6D3] border border-[#D2B48C] text-amber-900 p-3.5 rounded-xl shadow-xs flex items-start gap-3">
              <AlertTriangle size={24} className="text-amber-700 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-black text-sm uppercase tracking-wide flex items-center gap-1.5">
                  ⚡ OIL CHANGE DUE SOON
                </h4>
                <p className="text-xs font-semibold mt-0.5 leading-relaxed">
                  Oil maintenance threshold reached. Only{' '}
                  <span className="font-black text-amber-950">{oilStatus.hoursRemaining.toFixed(1)} hours remaining</span> before target interval expiry.
                </p>
              </div>
            </div>
          )}

          {/* Live Counter & Telemetry Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Live Cumulative Runtime</span>
                <Clock size={16} className="text-blue-600" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-mono font-black text-slate-900">
                  {loom.running_hours.toFixed(1)}
                </span>
                <span className="text-xs font-bold text-slate-500 ml-1">Hours</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-1">
                Telemetry active
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Runtime Since Oil Change</span>
                <Wrench size={16} className="text-amber-600" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-mono font-black text-slate-900">
                  {hoursUsed.toFixed(1)}
                </span>
                <span className="text-xs font-bold text-slate-500 ml-1">/ {loom.oil_target_hours} hrs</span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden border border-slate-200">
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

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Machine Speed & Efficiency</span>
                <Gauge size={16} className="text-emerald-600" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-mono font-black text-slate-900">
                    {loom.rpm}
                  </span>
                  <span className="text-xs font-bold text-slate-500 ml-1">RPM</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-mono font-black text-emerald-600">
                    {loom.efficiency.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-1">
                Picks: {loom.total_picks.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Oil Maintenance Configuration Panel */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="bg-slate-100/90 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                <Wrench size={16} className="text-amber-600" /> Oil Maintenance Configuration Panel
              </h3>
              <button
                type="button"
                onClick={handleResetCounter}
                className="flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <RotateCcw size={14} /> Record Oil Change Now
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="p-4 space-y-4">
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
                  <span className="text-[10px] text-slate-500 font-medium">Triggers Tan warning when within threshold</span>
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
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  <Save size={16} /> Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500">
            Loom ID: {loom.loom_id || `loom-${loom.loom_number}`}
          </span>

          <div className="flex items-center gap-2">
            {onNavigateToFullView && (
              <button
                onClick={() => onNavigateToFullView(loom.loom_number)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-extrabold rounded-lg transition-colors cursor-pointer shadow-2xs"
              >
                <Cpu size={15} /> Open Full Machine View
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-white hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
