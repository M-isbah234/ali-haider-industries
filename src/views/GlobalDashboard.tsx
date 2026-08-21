"use client";
import React, { useState } from 'react';
import { useTelemetry } from '../contexts/TelemetryContext';
import { MachineMatrixGrid } from '../components/ui/MachineMatrixGrid';
import { LineSummaries } from '../components/ui/LineSummaries';
import { BottomSummaryPanel } from '../components/ui/BottomSummaryPanel';
import { getEffectiveLoomStatusConfig } from '../types';

export const GlobalDashboard: React.FC = () => {
  const { looms, setSelectedLoom } = useTelemetry();

  // State for active status filter
  const [activeFilterStatus, setActiveFilterStatus] = useState<string | null>(null);

  // Card click → go directly to Full Machine View
  const handleCardClick = (loomNumber: number) => {
    setSelectedLoom(loomNumber);
  };

  return (
    <div className="h-[calc(100vh-56px)] overflow-hidden flex flex-col p-2 sm:p-2.5 md:p-3 bg-[#e8ebf0] box-border gap-2">

      {/* Main Viewport Content: 6x6 Matrix (Left) + Line Summaries (Right) */}
      <div className="flex-1 min-h-0 w-full grid grid-cols-12 gap-2 overflow-hidden">
        {/* Left Column: 6x6 Machine Matrix Grid (Takes 10 cols on desktop) */}
        <div className="col-span-12 lg:col-span-11 xl:col-span-11 h-full min-h-0 flex flex-col">
          <MachineMatrixGrid
            looms={looms}
            onSelectLoom={handleCardClick}
            activeFilterStatus={activeFilterStatus}
          />
        </div>

        {/* Right Column: Line Summaries (Line 1 to Line 6) (Takes 2 cols on desktop) */}
        <div className="hidden lg:block col-span-1 xl:col-span-1 h-full min-h-0">
          <LineSummaries
            looms={looms}
            onSelectLine={setActiveFilterStatus}
            activeFilterLine={activeFilterStatus?.startsWith('LINE_') ? activeFilterStatus : null}
          />
        </div>
      </div>

      {/* Bottom Horizontal Summary Panel (All 14 Stop & Maintenance States) */}
      <BottomSummaryPanel
        looms={looms}
        onFilterStatus={setActiveFilterStatus}
        activeFilter={activeFilterStatus}
      />
    </div>
  );
};
