"use client";
import React, { useState } from 'react'
import { Cloud, Droplets, AlertTriangle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useTelemetry } from '../../contexts/TelemetryContext'
import toast from 'react-hot-toast'

const temperatureData = [
  { time: '06:00', temp: 22 },
  { time: '09:00', temp: 25 },
  { time: '12:00', temp: 28 },
  { time: '15:00', temp: 32 },
  { time: '18:00', temp: 30 },
  { time: '21:00', temp: 26 },
  { time: '24:00', temp: 24 },
]

export const ClimateMonitoring: React.FC = () => {
  const { ambient } = useTelemetry()
  const [coolingActive, setCoolingActive] = useState(true)

  const temp = ambient ? ambient.hall_temperature_celsius : 28.5
  const humidity = ambient ? ambient.hall_humidity_percentage : 65.0
  
  const isTempWarning = temp > 30 || temp < 20
  const isHumidWarning = humidity > 70 || humidity < 40

  return (
    <div className="space-y-4 max-w-5xl mx-auto mt-4">
      <h2 className="text-2xl font-bold text-slate-800 mb-4 tracking-tight">Climate Control</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current Conditions - Left Column */}
        <div className="grid grid-cols-1 gap-3 space-y-1">
          {/* Temperature Card */}
          <div className={`rounded-xl p-5 border shadow-sm transition-colors duration-300 ${isTempWarning ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Temperature</p>
              <Cloud size={18} className={isTempWarning ? 'text-amber-500' : 'text-orange-500'} />
            </div>
            <div className="text-3xl font-bold text-slate-800 mb-2">{temp.toFixed(1)}°C</div>
            <p className="text-xs text-slate-500 font-medium">Target: 25-28°C</p>
            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3">
              <div className={`h-full rounded-full transition-all duration-1000 ${isTempWarning ? 'bg-amber-500' : 'bg-orange-500'}`} style={{ width: `${Math.min(100, Math.max(0, (temp / 40) * 100))}%` }}></div>
            </div>
          </div>

          {/* Humidity Card */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Humidity</p>
              <Droplets size={18} className="text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-slate-800 mb-2">{humidity.toFixed(1)}%</div>
            <p className="text-xs text-slate-500 font-medium">Optimal: 45-60%</p>
            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${humidity}%` }}></div>
            </div>
          </div>

          {/* Air Quality Card */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Air Quality</p>
              <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-sm"></div>
            </div>
            <div className="text-2xl font-bold text-emerald-600 mb-2">Good</div>
            <p className="text-xs text-slate-500 font-medium">Particle count: 145 µg/m³</p>
          </div>
        </div>

        {/* Charts & Alerts - Right Column */}
        <div className="md:col-span-2 space-y-4">
          {/* Temperature Trend */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm h-[280px] flex flex-col">
            <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">Temperature Trend</h3>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={temperatureData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 12 }} domain={[20, 35]} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    itemStyle={{ color: '#1e293b' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="temp"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={{ fill: '#f59e0b', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Alerts */}
          {isTempWarning && (
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 shadow-sm">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-700">Temperature Warning</p>
                  <p className="text-sm text-amber-800 mt-1">Temperature exceeds optimal range. Adjust cooling system.</p>
                </div>
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div className="grid grid-cols-2 gap-3 mt-auto pt-2">
            <button
              onClick={() => {
                const next = !coolingActive;
                setCoolingActive(next);
                toast.success(next ? 'HVAC Cooling System Activated (25°C Target)' : 'HVAC Cooling System Standby');
              }}
              className={`px-4 py-2.5 transition-colors rounded-lg text-sm font-bold shadow-2xs cursor-pointer ${
                coolingActive ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}
            >
              {coolingActive ? 'Cooling ON' : 'Cooling Standby'}
            </button>
            <button
              onClick={() => toast.success('Hall Climate Setpoint: Temp Target 26.0°C | Humidity Target 65%')}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 transition-colors rounded-lg text-sm font-bold text-slate-700 border border-slate-200 shadow-2xs cursor-pointer"
            >
              Climate Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

