"use client";

import { useTelemetry } from "@/contexts/TelemetryContext";
import { GlobalDashboard } from "@/views/GlobalDashboard";
import { LoomDashboard } from "@/views/LoomDashboard";
import { useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

function HomeContent() {
  const { selectedLoom, setSelectedLoom } = useTelemetry();
  const searchParams = useSearchParams();
  const loomParam = searchParams.get("loom");

  useEffect(() => {
    if (loomParam) {
      const num = parseInt(loomParam, 10);
      if (!isNaN(num) && num >= 1 && num <= 36) {
        if (selectedLoom !== num) {
          setSelectedLoom(num);
        }
      } else {
        if (selectedLoom !== 'GLOBAL') {
          setSelectedLoom('GLOBAL');
        }
      }
    } else {
      if (selectedLoom !== 'GLOBAL') {
        setSelectedLoom('GLOBAL');
      }
    }
  }, [loomParam, setSelectedLoom, selectedLoom]);

  return selectedLoom === 'GLOBAL' ? <GlobalDashboard /> : <LoomDashboard />;
}

export default function Home() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-800">Loading Floor Plan...</div>}>
      <HomeContent />
    </Suspense>
  );
}
