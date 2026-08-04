"use client";

import { useTelemetry } from "@/contexts/TelemetryContext";
import { GlobalDashboard } from "@/views/GlobalDashboard";
import { LoomDashboard } from "@/views/LoomDashboard";

export default function Home() {
  const { selectedLoom } = useTelemetry();

  return selectedLoom === 'GLOBAL' ? <GlobalDashboard /> : <LoomDashboard />;
}
