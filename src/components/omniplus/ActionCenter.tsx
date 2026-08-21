"use client";
import React, { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle, Clock, Wrench, Plus } from 'lucide-react'
import { useTelemetry } from '../../contexts/TelemetryContext'
import toast from 'react-hot-toast'

interface LogEntry {
  id: number
  type: 'warning' | 'error' | 'info' | 'maintenance'
  message: string
  timestamp: string
  status: 'open' | 'resolved'
}

export const ActionCenter: React.FC<{ userLevel?: string }> = ({ userLevel = 'admin' }) => {
  const { ambient } = useTelemetry()
  const [filterTab, setFilterTab] = useState<'all' | 'open' | 'resolved' | 'maintenance'>('all')
  const [logEntries, setLogEntries] = useState<LogEntry[]>([
    {
      id: 2,
      type: 'warning',
      message: 'Oil Change Due Alert for Loom 13',
      timestamp: '14:10',
      status: 'open',
    },
    {
      id: 3,
      type: 'maintenance',
      message: 'Oil change completed on Loom 04',
      timestamp: '11:20',
      status: 'resolved',
    },
    {
      id: 4,
      type: 'error',
      message: 'Warp break detected on Loom 02',
      timestamp: '09:15',
      status: 'resolved',
    },
    {
      id: 5,
      type: 'info',
      message: 'Shift change recorded - Shift A active',
      timestamp: '08:00',
      status: 'resolved',
    },
  ])

  // Dynamically inject pressure warning
  useEffect(() => {
    if (ambient && ambient.main_air_pressure_bar < 5.5) {
      setLogEntries((prev) => {
        if (!prev.find(e => e.id === 1 && e.status === 'open')) {
          return [
            {
              id: 1,
              type: 'warning',
              message: `Main Compressor Pressure Dropped (${ambient.main_air_pressure_bar.toFixed(2)} Bar)`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: 'open'
            },
            ...prev
          ]
        }
        return prev;
      })
    }
  }, [ambient?.main_air_pressure_bar])

  const getIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle size={18} className="text-amber-500" />
      case 'error':
        return <AlertTriangle size={18} className="text-red-500" />
      case 'maintenance':
        return <Wrench size={18} className="text-blue-500" />
      default:
        return <Clock size={18} className="text-slate-400" />
    }
  }

  const getStatusColor = (type: LogEntry['type'], status: LogEntry['status']) => {
    if (status === 'resolved') return 'bg-white border-slate-200 shadow-2xs'
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200 shadow-2xs'
      case 'warning':
        return 'bg-amber-50 border-amber-200 shadow-2xs'
      case 'maintenance':
        return 'bg-blue-50 border-blue-200 shadow-2xs'
      default:
        return 'bg-white border-slate-200 shadow-2xs'
    }
  }

  const handleResolve = (id: number) => {
    setLogEntries(prev => prev.map(entry => entry.id === id ? { ...entry, status: 'resolved' } : entry))
    toast.success('Action item marked as resolved!')
  }

  const handleAddNewEntry = () => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const newEntry: LogEntry = {
      id: Date.now(),
      type: 'maintenance',
      message: 'Technician routine check completed',
      timestamp: now,
      status: 'open'
    }
    setLogEntries(prev => [newEntry, ...prev])
    toast.success('New action log entry created!')
  }

  const filteredEntries = logEntries.filter(e => {
    if (filterTab === 'open') return e.status === 'open'
    if (filterTab === 'resolved') return e.status === 'resolved'
    if (filterTab === 'maintenance') return e.type === 'maintenance'
    return true
  })

  const openActions = logEntries.filter(e => e.status === 'open').length

  return (
    <div className="space-y-6 max-w-5xl mx-auto mt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-1 tracking-tight">Action Center</h2>
          <p className="text-sm text-slate-500">Machine events and maintenance logbook</p>
        </div>
        {userLevel === 'admin' || userLevel === 'technician' ? (
          <button
            onClick={handleAddNewEntry}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 transition-colors rounded-lg text-white font-bold text-sm shadow-2xs cursor-pointer"
          >
            <Plus size={18} />
            New Entry
          </button>
        ) : null}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterTab('all')}
          className={`px-4 py-2 rounded-lg text-sm font-bold shadow-2xs transition-colors cursor-pointer ${
            filterTab === 'all'
              ? 'bg-blue-600 border border-blue-600 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Events ({logEntries.length})
        </button>
        <button
          onClick={() => setFilterTab('open')}
          className={`px-4 py-2 rounded-lg text-sm font-bold shadow-2xs transition-colors cursor-pointer ${
            filterTab === 'open'
              ? 'bg-blue-600 border border-blue-600 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Open ({openActions})
        </button>
        <button
          onClick={() => setFilterTab('resolved')}
          className={`px-4 py-2 rounded-lg text-sm font-bold shadow-2xs transition-colors cursor-pointer ${
            filterTab === 'resolved'
              ? 'bg-blue-600 border border-blue-600 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Resolved ({logEntries.filter(e => e.status === 'resolved').length})
        </button>
        <button
          onClick={() => setFilterTab('maintenance')}
          className={`px-4 py-2 rounded-lg text-sm font-bold shadow-2xs transition-colors cursor-pointer ${
            filterTab === 'maintenance'
              ? 'bg-blue-600 border border-blue-600 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Maintenance ({logEntries.filter(e => e.type === 'maintenance').length})
        </button>
      </div>

      {/* Logbook Entries */}
      <div className="space-y-3">
        {filteredEntries.map((entry) => (
          <div
            key={entry.id}
            className={`rounded-lg p-4 border flex items-start gap-4 transition-colors duration-300 ${getStatusColor(
              entry.type,
              entry.status
            )}`}
          >
            {/* Icon */}
            <div className="flex-shrink-0 mt-1">{getIcon(entry.type)}</div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-bold text-slate-800">{entry.message}</h3>
                <span className="text-xs font-semibold text-slate-500">{entry.timestamp}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full transition-colors ${
                    entry.status === 'resolved'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {entry.status === 'resolved' ? (
                    <>
                      <CheckCircle size={12} className="inline mr-1 mb-0.5" />
                      Resolved
                    </>
                  ) : (
                    <>
                      <Clock size={12} className="inline mr-1 mb-0.5" />
                      Open
                    </>
                  )}
                </span>
                {entry.type === 'maintenance' && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                    <Wrench size={12} className="inline mr-1 mb-0.5" />
                    Maintenance
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            {(userLevel === 'admin' || userLevel === 'technician') && entry.status === 'open' ? (
              <button 
                onClick={() => handleResolve(entry.id)}
                className="flex-shrink-0 px-4 py-1.5 bg-white hover:bg-blue-50 border border-slate-200 shadow-2xs rounded-md text-xs font-bold text-blue-600 transition-colors cursor-pointer"
              >
                Resolve
              </button>
            ) : null}
          </div>
        ))}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Total Events</p>
          <p className="text-3xl font-bold text-slate-800">{logEntries.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Open Actions</p>
          <p className="text-3xl font-bold text-amber-600">{openActions}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Uptime</p>
          <p className="text-3xl font-bold text-emerald-600">99.2%</p>
        </div>
      </div>
    </div>
  )
}
