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
    <div className="absolute top-12 left-2 z-10 text-foreground/30 hover:text-foreground transition-colors hover:backdrop-blur-sm hover:border border-border rounded-md p-2 min-w-[100px]">
      {indicators.map((ind) => {
        const def = getIndicatorById(ind.definitionId);
        if (!def) return null;

        const paramStr = def.params.length > 0
          ? `(${def.params.map((p) => ind.params[p.key]).join(",")})`
          : "";

        return (
          <div
            key={ind.instanceId}
            className="flex items-center justify-between gap-2 px-1 py-0.5 rounded text-xs transition-colors"
            onMouseEnter={() => setHoveredId(ind.instanceId)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <span>
              {def.shortName}
              <span>{paramStr}</span>
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
