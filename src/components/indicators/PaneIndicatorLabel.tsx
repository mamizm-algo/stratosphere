import { useState } from "react";
import { ActiveIndicator } from "@/lib/indicators/types";
import { getIndicatorById } from "@/lib/indicators/registry";
import { Settings, X } from "lucide-react";

export interface CrosshairValues {
  [instanceId: string]: { [seriesKey: string]: number | null };
}

interface PaneIndicatorLabelProps {
  indicators: ActiveIndicator[];
  crosshairValues: CrosshairValues;
  onRemove: (instanceId: string) => void;
  onConfigure: (instanceId: string) => void;
  style?: React.CSSProperties;
}

const formatValue = (definitionId: string, key: string, value: number | null): string => {
  if (value === null || value === undefined) return "";
  if (definitionId === "volume") return Math.round(value).toLocaleString();
  if (definitionId === "rsi") return value.toFixed(2);
  if (definitionId === "macd") return value.toFixed(4);
  return value.toFixed(2);
};

export const PaneIndicatorLabel = ({
  indicators,
  crosshairValues,
  onRemove,
  onConfigure,
  style,
}: PaneIndicatorLabelProps) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (indicators.length === 0) return null;

  return (
    <div
      className="absolute z-10 pointer-events-auto"
      style={{ left: 8, ...style }}
    >
      {indicators.map((ind) => {
        const def = getIndicatorById(ind.definitionId);
        if (!def) return null;

        const paramStr =
          def.params.length > 0
            ? `(${def.params.map((p) => ind.params[p.key]).join(",")})`
            : "";

        const values = crosshairValues[ind.instanceId] || {};
        const valueStr = Object.entries(values)
          .filter(([, v]) => v !== null && v !== undefined)
          .map(([key, v]) => formatValue(ind.definitionId, key, v))
          .join(" ");

        return (
          <div
            key={ind.instanceId}
            className="flex items-center gap-1.5 px-1 py-0.5 text-xs transition-colors text-foreground/50 hover:text-foreground"
            onMouseEnter={() => setHoveredId(ind.instanceId)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <span className="font-medium">
              {def.shortName}
              {paramStr}
            </span>
            {valueStr && (
              <span className="text-foreground/70 tabular-nums">{valueStr}</span>
            )}
            {hoveredId === ind.instanceId && (
              <div className="flex items-center gap-0.5 ml-1">
                {def.params.length > 0 && (
                  <button
                    onClick={() => onConfigure(ind.instanceId)}
                    className="p-0.5 hover:text-primary transition-colors"
                  >
                    <Settings className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={() => onRemove(ind.instanceId)}
                  className="p-0.5 hover:text-destructive transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
