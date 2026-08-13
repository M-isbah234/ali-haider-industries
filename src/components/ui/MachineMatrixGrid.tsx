import React from 'react';
import { LoomState } from '../../types';

interface MachineMatrixGridProps {
  looms: Record<number, LoomState>;
  onSelectLoom: (loomNumber: number) => void;
}

export const MachineMatrixGrid: React.FC<MachineMatrixGridProps> = ({ looms, onSelectLoom }) => {
  return (
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
            onClick={() => onSelectLoom(loom.loom_number)}
            className={`text-left bg-white p-3 rounded-lg border-l-4 shadow-sm transition-all duration-150 cursor-pointer min-h-[100px] ${borderColor} ${bgHover} border-t border-r border-b border-y-slate-200 border-r-slate-200 hover:shadow-md transform hover:-translate-y-0.5`}
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
  );
};
