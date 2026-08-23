import React from 'react';
import { LoomState, getLoomModel, getEffectiveLoomStatusConfig, getOilStatus } from '../../types';

interface MachineMatrixGridProps {
  looms: Record<number, LoomState>;
  onSelectLoom: (loomNumber: number) => void;
  activeFilterStatus?: string | null;
}

export const MachineMatrixGrid: React.FC<MachineMatrixGridProps> = ({
  looms,
  onSelectLoom,
  activeFilterStatus = null,
}) => {
  // Ensure array contains all 36 looms ordered 1 to 36
  const loomList = React.useMemo(() => {
    const sorted = Object.values(looms).sort((a, b) => a.loom_number - b.loom_number);
    const map = new Map<number, LoomState>();
    sorted.forEach((l) => map.set(l.loom_number, l));

    const result: LoomState[] = [];
    for (let i = 1; i <= 36; i++) {
      if (map.has(i)) {
        result.push(map.get(i)!);
      } else {
        result.push({
          loom_number: i,
          status: 'RUNNING',
          rpm: 780,
          efficiency: 92.5,
          total_picks: 0,
          total_meters: 0,
          warp_stops_daily: 0,
          filling_stops_daily: 0,
          running_hours: 3200 + i * 50,
          oil_target_hours: 5000,
          oil_last_date: '2026-01-10',
          oil_last_hours: 0,
          oil_warning_threshold: 200,
        });
      }
    }
    return result;
  }, [looms]);

  return (
    <div className="h-full w-full grid grid-cols-6 auto-rows-fr gap-1.5 sm:gap-2">
      {loomList.map((loom) => {
        const model = getLoomModel(loom.loom_number);
        const config = getEffectiveLoomStatusConfig(loom);
        const oil = getOilStatus(loom);

        let matchesFilter = true;
        if (activeFilterStatus) {
          if (activeFilterStatus.startsWith('LINE_')) {
            const lineNum = parseInt(activeFilterStatus.replace('LINE_', ''), 10);
            const startLoom = (lineNum - 1) * 6 + 1;
            const endLoom = lineNum * 6;
            matchesFilter = loom.loom_number >= startLoom && loom.loom_number <= endLoom;
          } else {
            matchesFilter = config.key === activeFilterStatus;
          }
        }

        return (
          <button
            key={loom.loom_number}
            onClick={() => onSelectLoom(loom.loom_number)}
            style={{
              backgroundColor: config.bgHex,
              borderLeftColor: oil.state === 'OVERDUE' ? '#EF4444' : config.accentHex,
              border: oil.state === 'OVERDUE' ? '2px solid #EF4444' : undefined,
              boxSizing: 'border-box',
            }}
            className={`text-left rounded-xl shadow-2xs transition-all duration-150 cursor-pointer flex flex-col justify-between h-full relative group hover:shadow-md hover:-translate-y-0.5 ${
              oil.state === 'OVERDUE' 
                ? 'p-2 sm:p-2.5 pb-2 sm:pb-3 border-none' 
                : 'p-2.5 sm:p-3 pb-3 sm:pb-4 border-l-4 border-t border-r border-b border-l-transparent'
            } ${
              config.cardClass
            } ${oil.state === 'OVERDUE' ? '' : config.borderLeft} ${
              !matchesFilter ? 'opacity-25 grayscale-40 scale-98' : 'opacity-100 scale-100 ring-1 ring-black/5'
            }`}
          >
            {/* Top Row: Loom ID Heading + Model Tag directly next to it & Status Badge */}
            <div className="flex justify-between items-center w-full gap-1 leading-none min-w-0">
              <div className="flex items-center gap-1 sm:gap-1.5 flex-nowrap min-w-0 overflow-hidden shrink">
                <span className="font-extrabold text-xs sm:text-sm tracking-tight text-slate-900 leading-none whitespace-nowrap shrink-0">
                  Loom {loom.loom_number < 10 ? `0${loom.loom_number}` : loom.loom_number}
                </span>
                <span className="text-[8.5px] sm:text-[9.5px] font-black uppercase px-1 py-0.3 rounded bg-black/10 text-slate-800 shrink-0 whitespace-nowrap">
                  {model}
                </span>
                {oil.state === 'OVERDUE' && (
                  <span className="text-xs animate-bounce shrink-0" title="OIL CHANGE OVERDUE">
                    ⚠️
                  </span>
                )}
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-1 shrink-0">
                <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
                <span
                  className={`text-[8px] sm:text-[9.5px] font-black uppercase px-1 py-0.3 rounded border shadow-2xs ${config.badgeClass}`}
                >
                  {config.key === 'OIL_CHANGE_OVERDUE' ? (
                    <span className="flex flex-col items-center leading-[1.0] text-center">
                      <span>OIL</span>
                      <span>OVERDUE</span>
                    </span>
                  ) : (
                    config.badgeText
                  )}
                </span>
              </div>
            </div>

            {/* Middle Row: Efficiency Metric & Runtime Hours */}
            <div className="my-0.5 flex items-baseline justify-between w-full">
              <div className="text-base sm:text-lg md:text-xl font-mono font-black tracking-tight leading-tight text-slate-950">
                {loom.efficiency.toFixed(1)}%
              </div>
              <div className="text-[9px] sm:text-[10px] font-mono font-bold opacity-75 text-slate-800">
                {loom.running_hours.toFixed(0)} <span className="text-[8px] font-normal">hrs</span>
              </div>
            </div>

            {/* Bottom Row: RPM & Status Label — always visible */}
            <div className="flex justify-between items-center w-full pt-1.5 border-t border-black/10 mt-auto min-w-0 gap-1">
              <div className="flex items-baseline gap-0.5 shrink-0">
                <span className="text-xs sm:text-sm font-mono font-black text-slate-950 leading-none">
                  {loom.rpm}
                </span>
                <span className="text-[9px] sm:text-[10px] font-black text-slate-700 font-sans uppercase leading-none">
                  RPM
                </span>
              </div>

              <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider truncate min-w-0 shrink text-right ${config.textClass}`}>
                {config.label}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
