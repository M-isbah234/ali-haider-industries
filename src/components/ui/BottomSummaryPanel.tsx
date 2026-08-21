import React from 'react';
import { LoomState, ALL_STATUS_KEYS, STATUS_CONFIGS, getEffectiveLoomStatusConfig } from '../../types';
import { Filter, XCircle } from 'lucide-react';

interface BottomSummaryPanelProps {
  looms: Record<number, LoomState>;
  onFilterStatus?: (statusKey: string | null) => void;
  activeFilter?: string | null;
}

export const BottomSummaryPanel: React.FC<BottomSummaryPanelProps> = ({
  looms,
  onFilterStatus,
  activeFilter = null,
}) => {
  // Count looms in each of the 14 states (using getEffectiveLoomStatusConfig)
  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    ALL_STATUS_KEYS.forEach((key) => {
      counts[key] = 0;
    });

    Object.values(looms).forEach((loom) => {
      const config = getEffectiveLoomStatusConfig(loom);
      if (counts[config.key] !== undefined) {
        counts[config.key]++;
      } else {
        counts['OLS'] = (counts['OLS'] || 0) + 1;
      }
    });

    return counts;
  }, [looms]);

  return (
    <div className="w-full bg-white/95 rounded-xl border border-slate-300 shadow-xs p-1.5 sm:p-2 shrink-0">
      <div className="flex items-center justify-between mb-1.5 px-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
            <Filter size={13} className="text-blue-600" /> Live Telemetry Matrix — Filter by Machine Status
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {activeFilter && (
            <button
              onClick={() => onFilterStatus && onFilterStatus(null)}
              className="flex items-center gap-1 text-[10px] font-extrabold text-red-600 hover:text-red-800 bg-red-50 px-2 py-0.5 rounded-full border border-red-200 cursor-pointer shadow-2xs transition-colors"
            >
              <XCircle size={12} /> Clear Filter
            </button>
          )}
          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            36 Looms Monitored
          </span>
        </div>
      </div>

      {/* Flex-wrap chip row — full label names, auto-sized */}
      <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
        {ALL_STATUS_KEYS.map((key) => {
          const cfg = STATUS_CONFIGS[key];
          if (!cfg) return null;
          const count = statusCounts[key] || 0;
          const isSelected = activeFilter === key;

          return (
            <button
              key={key}
              onClick={() => onFilterStatus && onFilterStatus(isSelected ? null : key)}
              title={`Filter to ${cfg.label} (${count} looms)`}
              style={{
                backgroundColor: cfg.bgHex,
                borderColor: cfg.accentHex,
              }}
              className={`flex items-center gap-1 px-2 py-1 sm:py-1.5 rounded-lg border shadow-2xs transition-all duration-150 cursor-pointer whitespace-nowrap ${
                isSelected ? 'ring-2 ring-blue-600 ring-offset-1 scale-105 font-bold' : 'hover:scale-102 opacity-95 hover:opacity-100'
              } ${cfg.cardClass}`}
            >
              {/* Solid color chip instead of emoji for KNOTTING, plain color dot for others */}
              <span
                className="inline-block w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: cfg.accentHex }}
              />
              <span className="text-[9px] sm:text-[10px] font-extrabold leading-tight tracking-tight text-slate-950">
                {cfg.label.toUpperCase()}
              </span>
              {cfg.key === 'OIL_CHANGE_OVERDUE' && (
                <span className="text-[10px]">⚠️</span>
              )}
              <span
                className={`ml-0.5 text-[9px] sm:text-[10px] font-mono font-black px-1 py-0.2 rounded ${
                  count > 0 ? 'bg-black/15 text-slate-950' : 'bg-black/5 text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
