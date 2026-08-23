export type LoomStatusCode = 
  | 'RUNNING' 
  | 'RUN' 
  | 'WARP_BREAK' 
  | 'STOPPED_WARP' 
  | 'WEFT_BREAK' 
  | 'STOPPED_FILLING' 
  | 'CONE_BREAK' 
  | 'SELVEDGE_BREAK' 
  | 'ELECTRICAL_ERROR' 
  | 'MECHANICAL_ERROR' 
  | 'BEAM_ERROR' 
  | 'DOFFING' 
  | 'OLS' 
  | 'LOW_AIR_PRESSURE' 
  | 'STOPPED_AIR' 
  | 'STOPPED_MANUAL' 
  | 'OIL_CHANGE_DUE' 
  | 'OIL_CHANGE_OVERDUE';

export interface LoomState {
  loom_id?: string;
  loom_number: number;
  status: LoomStatusCode | string;
  rpm: number;
  total_picks: number;
  total_meters: number;
  efficiency: number;
  warp_stops_daily: number;
  filling_stops_daily: number;
  shift_picks?: number;
  shift_meters?: number;
  last_updated?: string;

  // Oil Change Running-Hour Tracker Fields
  running_hours: number;          // Live cumulative machine runtime hours
  oil_target_hours: number;       // Target Oil Change Interval e.g. 5000 hrs
  oil_last_date: string;          // Last Oil Change Date e.g. "2026-01-15"
  oil_last_hours: number;         // Machine running hours at last oil change e.g. 1200 hrs
  oil_warning_threshold: number;  // Warning Threshold e.g. alert when within 200 hrs of target
}

export type MachineModel = 'OmniPlus I' | 'OmniPlus 800' | 'OmniPlus Summum';

export const getLoomModel = (loomNumber: number): MachineModel => {
  if (loomNumber <= 25) return 'OmniPlus I';
  if (loomNumber <= 34) return 'OmniPlus 800';
  return 'OmniPlus Summum';
};

export interface OilMaintenanceStatus {
  hoursSinceChange: number;
  hoursRemaining: number;
  state: 'NORMAL' | 'DUE' | 'OVERDUE';
}

export const getOilStatus = (loom: LoomState): OilMaintenanceStatus => {
  const runningHours = loom.running_hours || 0;
  const lastHours = loom.oil_last_hours || 0;
  const target = loom.oil_target_hours || 5000;
  const threshold = loom.oil_warning_threshold || 200;

  const hoursSinceChange = Math.max(0, runningHours - lastHours);
  const hoursRemaining = target - hoursSinceChange;

  if (hoursRemaining <= 0) {
    return { hoursSinceChange, hoursRemaining, state: 'OVERDUE' };
  } else if (hoursRemaining <= threshold) {
    return { hoursSinceChange, hoursRemaining, state: 'DUE' };
  }
  return { hoursSinceChange, hoursRemaining, state: 'NORMAL' };
};

export interface StatusConfig {
  key: LoomStatusCode;
  label: string;
  badgeText: string;
  emoji: string;
  bgHex: string;
  accentHex: string;
  cardClass: string;
  borderLeft: string;
  dotClass: string;
  textClass: string;
  badgeClass: string;
  legendBg: string;
  legendText: string;
  legendBorder: string;
  isOverdue?: boolean;
  description?: string;
}

export const ALL_STATUS_KEYS: LoomStatusCode[] = [
  'RUNNING',
  'WARP_BREAK',
  'WEFT_BREAK',
  'CONE_BREAK',
  'SELVEDGE_BREAK',
  'ELECTRICAL_ERROR',
  'MECHANICAL_ERROR',
  'BEAM_ERROR',
  'DOFFING',
  'OLS',
  'LOW_AIR_PRESSURE',
  'OIL_CHANGE_DUE',
  'OIL_CHANGE_OVERDUE',
];

export const STATUS_CONFIGS: Record<string, StatusConfig> = {
  RUNNING: {
    key: 'RUNNING',
    label: 'Running',
    badgeText: 'RUN',
    emoji: '🟢',
    bgHex: '#DCFCE7',
    accentHex: '#16A34A',
    cardClass: 'bg-[#DCFCE7] hover:bg-emerald-200/80 border-emerald-300 text-emerald-950',
    borderLeft: 'border-l-[#16A34A]',
    dotClass: 'bg-emerald-600',
    textClass: 'text-emerald-800 font-extrabold',
    badgeClass: 'bg-emerald-200/90 text-emerald-900 border-emerald-400 font-bold',
    legendBg: 'bg-[#DCFCE7]',
    legendText: 'text-emerald-900',
    legendBorder: 'border-emerald-400'
  },
  WARP_BREAK: {
    key: 'WARP_BREAK',
    label: 'Warp Break',
    badgeText: 'WARP',
    emoji: '🟥',
    bgHex: '#FEE2E2',
    accentHex: '#DC2626',
    cardClass: 'bg-[#FEE2E2] hover:bg-red-200/80 border-red-300 text-red-950',
    borderLeft: 'border-l-[#DC2626]',
    dotClass: 'bg-[#DC2626] animate-pulse',
    textClass: 'text-red-900 font-extrabold',
    badgeClass: 'bg-red-200/90 text-red-900 border-red-400 font-bold',
    legendBg: 'bg-[#FEE2E2]',
    legendText: 'text-red-900',
    legendBorder: 'border-red-400'
  },
  WEFT_BREAK: {
    key: 'WEFT_BREAK',
    label: 'Weft Break',
    badgeText: 'WEFT',
    emoji: '🟨',
    bgHex: '#FEF9C3',
    accentHex: '#CA8A04',
    cardClass: 'bg-[#FEF9C3] hover:bg-yellow-200/80 border-yellow-300 text-yellow-950',
    borderLeft: 'border-l-[#CA8A04]',
    dotClass: 'bg-[#CA8A04] animate-pulse',
    textClass: 'text-yellow-900 font-extrabold',
    badgeClass: 'bg-yellow-200/90 text-yellow-900 border-yellow-400 font-bold',
    legendBg: 'bg-[#FEF9C3]',
    legendText: 'text-yellow-900',
    legendBorder: 'border-yellow-400'
  },
  CONE_BREAK: {
    key: 'CONE_BREAK',
    label: 'Cone Breakage',
    badgeText: 'CONE',
    emoji: '🟫',
    bgHex: '#EFEBE9',
    accentHex: '#795548',
    cardClass: 'bg-[#EFEBE9] hover:bg-stone-200/90 border-stone-300 text-stone-900',
    borderLeft: 'border-l-[#795548]',
    dotClass: 'bg-[#795548]',
    textClass: 'text-stone-800 font-extrabold',
    badgeClass: 'bg-stone-200/90 text-stone-900 border-stone-400 font-bold',
    legendBg: 'bg-[#EFEBE9]',
    legendText: 'text-stone-900',
    legendBorder: 'border-stone-400'
  },
  SELVEDGE_BREAK: {
    key: 'SELVEDGE_BREAK',
    label: 'Selvedge Break',
    badgeText: 'SELVEDGE',
    emoji: '🟦',
    bgHex: '#DBEAFE',
    accentHex: '#1E3A8A',
    cardClass: 'bg-[#DBEAFE] hover:bg-blue-200/80 border-[#1E3A8A]/30 text-blue-950',
    borderLeft: 'border-l-[#1E3A8A]',
    dotClass: 'bg-[#1E3A8A] animate-pulse',
    textClass: 'text-[#1E3A8A] font-extrabold',
    badgeClass: 'bg-blue-100/90 text-[#1E3A8A] border-[#1E3A8A]/40 font-bold',
    legendBg: 'bg-[#DBEAFE]',
    legendText: 'text-[#1E3A8A]',
    legendBorder: 'border-[#1E3A8A]/40',
    description: 'Triggered if ELSY (Electronic Selvedge System) or waste cutter fails, or if binding yarn breaks.'
  },
  ELECTRICAL_ERROR: {
    key: 'ELECTRICAL_ERROR',
    label: 'Electrical Error',
    badgeText: 'ELEC',
    emoji: '🟧',
    bgHex: '#FFEDD5',
    accentHex: '#EA580C',
    cardClass: 'bg-[#FFEDD5] hover:bg-orange-200/80 border-orange-300 text-orange-950',
    borderLeft: 'border-l-[#EA580C]',
    dotClass: 'bg-[#EA580C] animate-pulse',
    textClass: 'text-orange-950 font-extrabold',
    badgeClass: 'bg-orange-200/90 text-orange-900 border-orange-400 font-bold',
    legendBg: 'bg-[#FFEDD5]',
    legendText: 'text-orange-950',
    legendBorder: 'border-orange-400'
  },
  MECHANICAL_ERROR: {
    key: 'MECHANICAL_ERROR',
    label: 'Mechanical Error',
    badgeText: 'MECH',
    emoji: '🟧',
    bgHex: '#FFEDD5',
    accentHex: '#D97706',
    cardClass: 'bg-[#FFEDD5] hover:bg-amber-200/80 border-amber-400 text-amber-950',
    borderLeft: 'border-l-[#D97706]',
    dotClass: 'bg-[#D97706] animate-pulse',
    textClass: 'text-amber-950 font-extrabold',
    badgeClass: 'bg-amber-300/90 text-amber-950 border-amber-500 font-bold',
    legendBg: 'bg-[#FFEDD5]',
    legendText: 'text-amber-950',
    legendBorder: 'border-amber-400'
  },
  BEAM_ERROR: {
    key: 'BEAM_ERROR',
    label: 'Beam Error',
    badgeText: 'BEAM',
    emoji: '🟪',
    bgHex: '#F3E8FF',
    accentHex: '#9333EA',
    cardClass: 'bg-[#F3E8FF] hover:bg-purple-200/80 border-purple-300 text-purple-950',
    borderLeft: 'border-l-[#9333EA]',
    dotClass: 'bg-[#9333EA] animate-pulse',
    textClass: 'text-purple-900 font-extrabold',
    badgeClass: 'bg-purple-200/90 text-purple-900 border-purple-400 font-bold',
    legendBg: 'bg-[#F3E8FF]',
    legendText: 'text-purple-900',
    legendBorder: 'border-purple-400'
  },
  DOFFING: {
    key: 'DOFFING',
    label: 'Doffing',
    badgeText: 'Dott',
    emoji: '🟦',
    bgHex: '#E0F2FE',
    accentHex: '#06B6D4',
    cardClass: 'bg-[#E0F2FE] hover:bg-sky-200/80 border-sky-300 text-sky-950',
    borderLeft: 'border-l-[#06B6D4]',
    dotClass: 'bg-[#06B6D4]',
    textClass: 'text-sky-900 font-extrabold',
    badgeClass: 'bg-sky-200/90 text-sky-900 border-sky-400 font-bold',
    legendBg: 'bg-[#E0F2FE]',
    legendText: 'text-sky-900',
    legendBorder: 'border-sky-400'
  },
  OLS: {
    key: 'OLS',
    label: 'OLS (Other Stop)',
    badgeText: 'OLS',
    emoji: '⬜',
    bgHex: '#F3F4F6',
    accentHex: '#6B7280',
    cardClass: 'bg-[#F3F4F6] hover:bg-gray-200/80 border-gray-300 text-gray-900',
    borderLeft: 'border-l-[#6B7280]',
    dotClass: 'bg-[#6B7280]',
    textClass: 'text-gray-800 font-extrabold',
    badgeClass: 'bg-gray-200/90 text-gray-900 border-gray-400 font-bold',
    legendBg: 'bg-[#F3F4F6]',
    legendText: 'text-gray-900',
    legendBorder: 'border-gray-400'
  },
  LOW_AIR_PRESSURE: {
    key: 'LOW_AIR_PRESSURE',
    label: 'Low Air Pressure',
    badgeText: 'LAP',
    emoji: '🩷',
    bgHex: '#FCE7F3',
    accentHex: '#EC4899',
    cardClass: 'bg-[#FCE7F3] hover:bg-pink-200/80 border-pink-300 text-pink-950',
    borderLeft: 'border-l-[#EC4899]',
    dotClass: 'bg-[#EC4899] animate-pulse',
    textClass: 'text-pink-900 font-extrabold',
    badgeClass: 'bg-pink-200/90 text-pink-900 border-pink-400 font-bold',
    legendBg: 'bg-[#FCE7F3]',
    legendText: 'text-pink-900',
    legendBorder: 'border-pink-400'
  },
  OIL_CHANGE_DUE: {
    key: 'OIL_CHANGE_DUE',
    label: 'Oil Change Due',
    badgeText: 'OIL DUE',
    emoji: '🟨',
    bgHex: '#F5E6D3',
    accentHex: '#D2B48C',
    cardClass: 'bg-[#F5E6D3] hover:bg-[#E8D8C3] border-[#D2B48C] text-amber-950',
    borderLeft: 'border-l-[#D2B48C]',
    dotClass: 'bg-[#D2B48C]',
    textClass: 'text-amber-900 font-extrabold',
    badgeClass: 'bg-[#D2B48C]/80 text-amber-950 border-[#C1A27A] font-bold',
    legendBg: 'bg-[#F5E6D3]',
    legendText: 'text-amber-950',
    legendBorder: 'border-[#D2B48C]'
  },
  OIL_CHANGE_OVERDUE: {
    key: 'OIL_CHANGE_OVERDUE',
    label: 'Oil Overdue',
    badgeText: 'OIL OVERDUE',
    emoji: '⚠️',
    bgHex: '#D2B48C',
    accentHex: '#B08B57',
    cardClass: 'bg-[#D2B48C] hover:bg-[#C1A27A] border-[#A07A46] text-amber-950',
    borderLeft: 'border-l-[#B08B57]',
    dotClass: 'bg-amber-900 animate-bounce',
    textClass: 'text-amber-950 font-black',
    badgeClass: 'bg-[#8B5A2B] text-white border-amber-950 font-black animate-pulse',
    legendBg: 'bg-[#D2B48C]',
    legendText: 'text-amber-950',
    legendBorder: 'border-[#B08B57]',
    isOverdue: true
  }
};

export const getLoomStatusConfig = (statusRaw?: string): StatusConfig => {
  const status = (statusRaw || '').toUpperCase();
  if (status === 'RUNNING' || status === 'RUN' || status === 'NORMAL') {
    return STATUS_CONFIGS.RUNNING;
  }
  if (status === 'WARP_BREAK' || status === 'STOPPED_WARP') {
    return STATUS_CONFIGS.WARP_BREAK;
  }
  if (status === 'WEFT_BREAK' || status === 'STOPPED_FILLING') {
    return STATUS_CONFIGS.WEFT_BREAK;
  }
  if (status === 'CONE_BREAK') {
    return STATUS_CONFIGS.CONE_BREAK;
  }
  if (status === 'SELVEDGE_BREAK') {
    return STATUS_CONFIGS.SELVEDGE_BREAK;
  }
  if (status === 'ELECTRICAL_ERROR') {
    return STATUS_CONFIGS.ELECTRICAL_ERROR;
  }
  if (status === 'MECHANICAL_ERROR') {
    return STATUS_CONFIGS.MECHANICAL_ERROR;
  }
  if (status === 'BEAM_ERROR') {
    return STATUS_CONFIGS.BEAM_ERROR;
  }
  if (status === 'DOFFING') {
    return STATUS_CONFIGS.DOFFING;
  }
  if (status === 'OLS') {
    return STATUS_CONFIGS.OLS;
  }
  if (status === 'LOW_AIR_PRESSURE' || status === 'STOPPED_AIR') {
    return STATUS_CONFIGS.LOW_AIR_PRESSURE;
  }
  if (status === 'OIL_CHANGE_DUE') {
    return STATUS_CONFIGS.OIL_CHANGE_DUE;
  }
  if (status === 'OIL_CHANGE_OVERDUE') {
    return STATUS_CONFIGS.OIL_CHANGE_OVERDUE;
  }
  return STATUS_CONFIGS.OLS;
};

export const getEffectiveLoomStatusConfig = (loom: LoomState): StatusConfig => {
  const oilStatus = getOilStatus(loom);
  if (oilStatus.state === 'OVERDUE') {
    return STATUS_CONFIGS.OIL_CHANGE_OVERDUE;
  }
  if (oilStatus.state === 'DUE') {
    return STATUS_CONFIGS.OIL_CHANGE_DUE;
  }
  return getLoomStatusConfig(loom.status);
};

export interface AmbientState {
  main_air_pressure_bar: number;
  hall_temperature_celsius: number;
  hall_humidity_percentage: number;
}

export interface SolarState {
  current_generation_kw: number;
  daily_yield_kwh: number;
}

export interface TelemetryContextType {
  looms: Record<number, LoomState>;
  ambient: AmbientState | null;
  solar: SolarState | null;
  selectedLoom: number | 'GLOBAL';
  setSelectedLoom: (loom: number | 'GLOBAL') => void;
  updateLoomOilSettings: (loomNumber: number, settings: { targetHours: number; lastDate: string; lastHours: number; warningThreshold: number }) => void;
  resetOilChange: (loomNumber: number) => void;
  mockMode: boolean;
}

