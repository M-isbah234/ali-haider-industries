import React from 'react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: React.ReactNode;
  valueColor?: string;
  compact?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  valueColor = 'text-blue-600',
  compact = false 
}) => {
  return (
    <div className={`bg-white border border-slate-300 shadow-xs rounded-xl flex flex-col justify-center ${
      compact ? 'p-2.5 sm:p-3 min-h-[64px]' : 'p-6 min-h-[120px]'
    }`}>
       <div className={`text-slate-500 font-bold uppercase tracking-wider ${
         compact ? 'text-[11px] mb-0.5' : 'text-sm mb-1'
       }`}>{title}</div>
       <div className={`font-mono font-black ${valueColor} ${
         compact ? 'text-xl sm:text-2xl leading-none flex items-baseline gap-1' : 'text-4xl'
       }`}>
         {value} {subtitle && <span className={`text-slate-400 font-normal ${compact ? 'text-xs sm:text-sm' : 'text-2xl'}`}>{subtitle}</span>}
       </div>
    </div>
  );
};

