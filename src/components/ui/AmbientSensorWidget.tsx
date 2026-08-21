import React from 'react';
import { Thermometer, Droplets, Gauge } from 'lucide-react';
import { AmbientState } from '../../types';

interface AmbientSensorWidgetProps {
  ambient: AmbientState | null;
  compact?: boolean;
}

export const AmbientSensorWidget: React.FC<AmbientSensorWidgetProps> = ({ ambient, compact = false }) => {
  const temp = ambient?.hall_temperature_celsius ?? 28.0;
  const humidity = ambient?.hall_humidity_percentage ?? 65.0;
  const pressure = ambient?.main_air_pressure_bar ?? 7.1;

  if (compact) {
    return (
      <div className="bg-[#1e293b] p-2.5 sm:p-3 rounded-xl shadow-xs flex flex-col justify-center text-slate-200 min-h-[64px]">
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Ambient Sensors</div>
        <div className="flex items-center justify-between text-xs gap-2">
          <span className="flex items-center gap-1"><Thermometer size={13} className="text-rose-400" /> {temp.toFixed(1)}°C</span>
          <span className="flex items-center gap-1"><Droplets size={13} className="text-blue-400" /> <span className="font-mono text-blue-300 font-bold">{humidity.toFixed(1)}%</span></span>
          <span className="flex items-center gap-1"><Gauge size={13} className="text-emerald-400" /> <span className="font-mono text-emerald-300 font-bold">{pressure.toFixed(1)} Bar</span></span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1e293b] p-5 rounded-xl shadow-md flex flex-col justify-between text-slate-200 min-h-[120px]">
       <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Ambient Sensors</div>
       <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm"><Thermometer size={16}/> Temp</span>
          <span className="font-mono font-bold">{temp.toFixed(1)}°C</span>
       </div>
       <div className="flex items-center justify-between mt-1">
          <span className="flex items-center gap-2 text-sm"><Droplets size={16}/> Humidity</span>
          <span className="font-mono font-bold text-blue-300">{humidity.toFixed(1)}%</span>
       </div>
       <div className="flex items-center justify-between mt-1">
          <span className="flex items-center gap-2 text-sm"><Gauge size={16}/> Air Press.</span>
          <span className="font-mono font-bold text-emerald-300">{pressure.toFixed(1)} Bar</span>
       </div>
    </div>
  );
};

