"use client";
import React, { useState, useEffect } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useTelemetry } from '../../contexts/TelemetryContext'

const efficiencyData = [
  { time: '00:00', efficiency: 88, target: 90 },
  { time: '02:00', efficiency: 89, target: 90 },
  { time: '04:00', efficiency: 91, target: 90 },
  { time: '06:00', efficiency: 92, target: 90 },
  { time: '08:00', efficiency: 94, target: 90 },
  { time: '10:00', efficiency: 93, target: 90 },
  { time: '12:00', efficiency: 95, target: 90 },
  { time: '14:00', efficiency: 94, target: 90 },
  { time: '16:00', efficiency: 92, target: 90 },
  { time: '18:00', efficiency: 91, target: 90 },
  { time: '20:00', efficiency: 89, target: 90 },
  { time: '22:00', efficiency: 88, target: 90 },
]

const stopsData = [
  { time: '00:00', warp: 2, filling: 1, yarn: 0 },
  { time: '04:00', warp: 1, filling: 2, yarn: 0 },
  { time: '08:00', warp: 3, filling: 1, yarn: 1 },
  { time: '12:00', warp: 2, filling: 0, yarn: 0 },
  { time: '16:00', warp: 1, filling: 3, yarn: 0 },
  { time: '20:00', warp: 0, filling: 1, yarn: 1 },
]

export const SensorDashboard: React.FC = () => {
  const { looms, selectedLoom, ambient } = useTelemetry()
  const loom = typeof selectedLoom === 'number' ? looms[selectedLoom] : null

  const baseRpm = loom ? loom.rpm : 0
  const airPressure = ambient ? ambient.main_air_pressure_bar.toFixed(1) : '6.2'
  
  // Real or mock status derivation
  const isStopped = loom?.status.startsWith('STOP') || baseRpm === 0
  const motorLoad = isStopped ? '0' : '68.4'
  const loadStatus = isStopped ? 'normal' : 'warning'

  // Jitter State for high-frequency simulation
  const [displayRpm, setDisplayRpm] = useState(baseRpm)
  const [displayAir, setDisplayAir] = useState(74.4)

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (!isStopped && baseRpm > 0) {
      interval = setInterval(() => {
        // Jitter RPM by +/- 2
        setDisplayRpm(baseRpm + Math.floor(Math.random() * 5) - 2)
        // Jitter Air Consumption around 74.4 by +/- 0.3
        setDisplayAir(74.4 + (Math.random() * 0.6 - 0.3))
      }, 150) // 150ms feels very fast and industrial
    } else {
      setDisplayRpm(0)
      setDisplayAir(0)
    }
    return () => clearInterval(interval)
  }, [baseRpm, isStopped])

  const sensorMetrics = [
    { label: 'Warp Tension (TSW)', value: '45.2', unit: 'cN', status: 'normal', pct: 'w-3/4' },
    { label: 'Air Consumption', value: displayAir.toFixed(1), unit: 'Nm³/h', status: 'normal', pct: 'w-3/4' },
    { label: 'Air Pressure', value: airPressure, unit: 'bar', status: ambient && ambient.main_air_pressure_bar < 5.5 ? 'warning' : 'normal', pct: 'w-11/12' },
    { label: 'Pick Rate', value: displayRpm.toString(), unit: 'picks/min', status: displayRpm < 600 && displayRpm > 0 ? 'warning' : 'normal', pct: displayRpm > 0 ? 'w-4/5' : 'w-0' },
    { label: 'Shed Height', value: '38.5', unit: 'mm', status: 'normal', pct: 'w-3/4' },
    { label: 'Motor Load', value: motorLoad, unit: '%', status: loadStatus, pct: isStopped ? 'w-0' : 'w-4/5' },
  ]

  return (
    <div className="space-y-4 max-w-5xl mx-auto mt-4">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {sensorMetrics.map((metric, idx) => (
          <div
            key={idx}
            className={`rounded-xl p-4 border transition-colors duration-300 ${
              metric.status === 'warning'
                ? 'bg-amber-50 border-amber-300 shadow-sm'
                : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <p className="text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wide">{metric.label}</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${
                metric.status === 'warning' ? 'text-amber-600' : 'text-blue-600'
              }`}>
                {metric.value}
              </span>
              <span className="text-sm text-slate-400 font-medium">{metric.unit}</span>
            </div>
            <div className={`w-full h-1.5 rounded-full mt-3 ${
              metric.status === 'warning' ? 'bg-amber-200' : 'bg-slate-100'
            }`}>
              <div className={`h-full rounded-full transition-all duration-1000 ${metric.pct} ${
                metric.status === 'warning'
                  ? 'bg-amber-500'
                  : 'bg-blue-500'
              }`}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Efficiency Chart */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">Efficiency Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={efficiencyData}>
              <defs>
                <linearGradient id="colorEff" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#64748b" tick={{ fontSize: 12 }} domain={[80, 100]} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                itemStyle={{ color: '#1e293b' }}
              />
              <Area
                type="monotone"
                dataKey="efficiency"
                stroke="#0ea5e9"
                fillOpacity={1}
                fill="url(#colorEff)"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Stops Chart */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">Stops Analysis</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stopsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#64748b" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                itemStyle={{ color: '#1e293b' }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
              <Bar dataKey="warp" stackId="a" fill="#ef4444" radius={[0,0,0,0]} barSize={20} />
              <Bar dataKey="filling" stackId="a" fill="#eab308" radius={[0,0,0,0]} barSize={20} />
              <Bar dataKey="yarn" stackId="a" fill="#f97316" radius={[4,4,0,0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Status Footer */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full animate-pulse shadow-sm ${ambient && ambient.main_air_pressure_bar < 5.5 ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
            <span className="text-sm font-semibold text-slate-700">
                {ambient && ambient.main_air_pressure_bar < 5.5 ? 'Pressure Warning' : 'All sensors operational'}
            </span>
          </div>
          <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>
          <div className="text-sm text-slate-500 hidden sm:block">Live WebSockets</div>
        </div>
      </div>
    </div>
  )
}

