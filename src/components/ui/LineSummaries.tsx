import React from 'react';
import { LoomState } from '../../types';
import { CheckCircle2 } from 'lucide-react';

interface LineSummariesProps {
  looms: Record<number, LoomState>;
  onSelectLine?: (lineKey: string | null) => void;
  activeFilterLine?: string | null;
}

export const LineSummaries: React.FC<LineSummariesProps> = ({
  looms,
  onSelectLine,
  activeFilterLine = null,
}) => {
  const lines = React.useMemo(() => {
    const result = [];
    for (let lineNum = 1; lineNum <= 6; lineNum++) {
      const startLoom = (lineNum - 1) * 6 + 1;
      const endLoom = lineNum * 6;
      let totalEff = 0;
      let count = 0;

      for (let i = startLoom; i <= endLoom; i++) {
        if (looms[i]) {
          totalEff += looms[i].efficiency || 0;
          count++;
        }
      }

      const avgEfficiency = count > 0 ? totalEff / count : 0;
      result.push({ lineNum, lineKey: `LINE_${lineNum}`, startLoom, endLoom, avgEfficiency });
    }
    return result;
  }, [looms]);

  return (
    <div className="flex flex-col h-full bg-white/95 rounded-xl border border-slate-200 shadow-xs px-1.5 py-2 overflow-hidden gap-1">
      {/* Compact header */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-200 shrink-0 px-0.5">
        <span className="text-[9px] font-black text-slate-600 uppercase tracking-wide">Lines</span>
        {activeFilterLine && (
          <button
            onClick={() => onSelectLine && onSelectLine(null)}
            className="text-[8px] font-extrabold text-blue-500 hover:text-blue-700 underline cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* Ultra-compact line rows */}
      <div className="flex-1 flex flex-col justify-around gap-0.5">
        {lines.map((line) => {
          const isSelected = activeFilterLine === line.lineKey;
          return (
            <button
              key={line.lineNum}
              onClick={() => onSelectLine && onSelectLine(isSelected ? null : line.lineKey)}
              title={`Filter to Line ${line.lineNum} (Looms ${line.startLoom}–${line.endLoom})`}
              className={`flex items-center justify-between py-1 px-1.5 rounded-md border transition-all duration-150 cursor-pointer w-full ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-700 ring-1 ring-blue-300'
                  : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-blue-50 hover:border-blue-300'
              }`}
            >
              <span className="text-[10px] font-extrabold leading-none">
                {isSelected && <CheckCircle2 size={9} className="inline mr-0.5 text-white" />}
                L{line.lineNum}
              </span>
              <span className={`text-[10px] font-mono font-black leading-none ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                {line.avgEfficiency.toFixed(1)}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
