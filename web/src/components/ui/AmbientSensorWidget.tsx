import React from 'react';
import { Thermometer, Droplets, Gauge } from 'lucide-react';
import { AmbientState } from '../../types';

interface AmbientSensorWidgetProps {
  ambient: AmbientState | null;
}

export const AmbientSensorWidget: React.FC<AmbientSensorWidgetProps> = ({ ambient }) => {
  return (
    <div className="bg-[#1e293b] p-5 rounded-xl shadow-md flex flex-col justify-between text-slate-200 min-h-[120px]">
       <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Ambient Sensors</div>
       <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm"><Thermometer size={16}/> Temp</span>
          <span className="font-mono font-bold">{ambient?.hall_temperature_celsius.toFixed(1)}°C</span>
       </div>
       <div className="flex items-center justify-between mt-1">
          <span className="flex items-center gap-2 text-sm"><Droplets size={16}/> Humidity</span>
          <span className="font-mono font-bold text-blue-300">{ambient?.hall_humidity_percentage.toFixed(1)}%</span>
       </div>
       <div className="flex items-center justify-between mt-1">
          <span className="flex items-center gap-2 text-sm"><Gauge size={16}/> Air Press.</span>
          <span className="font-mono font-bold text-emerald-300">{ambient?.main_air_pressure_bar.toFixed(1)} Bar</span>
       </div>
    </div>
  );
};
