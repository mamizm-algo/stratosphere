import { useState } from "react";
import { ActiveIndicator } from "@/lib/indicators/types";
import { getIndicatorById } from "@/lib/indicators/registry";
import { Settings, X } from "lucide-react";

interface ActiveIndicatorsListProps {
  indicators: ActiveIndicator[];
  onRemove: (instanceId: string) => void;
  onConfigure: (instanceId: string) => void;
}

export const ActiveIndicatorsList = ({
  indicators,
  onRemove,
  onConfigure,
}: ActiveIndicatorsListProps) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (indicators.length === 0) return null;

  return (
    <div className="absolute top-10 right-2 z-10 bg-background/90 backdrop-blur-sm border border-border rounded-md p-2 min-w-[140px]">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 px-1">Active</p>
      {indicators.map((ind) => {
        const def = getIndicatorById(ind.definitionId);
        if (!def) return null;

        const paramStr = def.params.length > 0
          ? `(${def.params.map((p) => ind.params[p.key]).join(",")})`
          : "";

        return (
          <div
            key={ind.instanceId}
            className="flex items-center justify-between gap-2 px-1 py-0.5 rounded text-xs hover:bg-accent/30 transition-colors"
            onMouseEnter={() => setHoveredId(ind.instanceId)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <span className="text-foreground">
              {def.shortName}
              <span className="text-muted-foreground">{paramStr}</span>
            </span>
            {hoveredId === ind.instanceId && (
              <div className="flex items-center gap-0.5">
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
