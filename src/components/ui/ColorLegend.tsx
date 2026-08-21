import React from 'react';
import { LoomState, ALL_STATUS_KEYS, STATUS_CONFIGS, getEffectiveLoomStatusConfig } from '../../types';

interface ColorLegendProps {
  looms?: Record<number, LoomState>;
  className?: string;
}

export const ColorLegend: React.FC<ColorLegendProps> = ({ looms, className = '' }) => {
  const counts = React.useMemo(() => {
    if (!looms) return null;
    const map: Record<string, number> = {};
    ALL_STATUS_KEYS.forEach((k) => {
      map[k] = 0;
    });
    Object.values(looms).forEach((l) => {
      const cfg = getEffectiveLoomStatusConfig(l);
      if (map[cfg.key] !== undefined) {
        map[cfg.key]++;
      }
    });
    return map;
  }, [looms]);

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {ALL_STATUS_KEYS.slice(0, 5).map((key) => {
        const cfg = STATUS_CONFIGS[key];
        if (!cfg) return null;
        const count = counts ? counts[key] || 0 : null;
        return (
          <div
            key={key}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border shadow-2xs ${cfg.legendBg} ${cfg.legendText} ${cfg.legendBorder}`}
            style={{ backgroundColor: cfg.bgHex, borderColor: cfg.accentHex }}
          >
            <span className={`w-2 h-2 rounded-full ${cfg.dotClass}`} />
            <span>{cfg.label}</span>
            {count !== null && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-black/10">
                {count}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
