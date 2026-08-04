import React from 'react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: React.ReactNode;
  valueColor?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({ title, value, subtitle, valueColor = 'text-blue-600' }) => {
  return (
    <div className="bg-white border border-slate-300 shadow-sm p-6 rounded-xl flex flex-col justify-center min-h-[120px]">
       <div className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">{title}</div>
       <div className={`text-4xl font-mono font-bold ${valueColor}`}>
         {value} {subtitle && <span className="text-2xl text-slate-400">{subtitle}</span>}
       </div>
    </div>
  );
};
