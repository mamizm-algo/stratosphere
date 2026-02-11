import { useState, useCallback } from "react";
import { ActiveIndicator } from "@/lib/indicators/types";
import { getIndicatorById } from "@/lib/indicators/registry";

let nextId = 1;

export function useIndicators() {
  const [activeIndicators, setActiveIndicators] = useState<ActiveIndicator[]>([]);

  const addIndicator = useCallback((definitionId: string) => {
    const def = getIndicatorById(definitionId);
    if (!def) return;

    const defaultParams: Record<string, number> = {};
    for (const p of def.params) {
      defaultParams[p.key] = p.default;
    }

    const instance: ActiveIndicator = {
      instanceId: `${definitionId}_${nextId++}`,
      definitionId,
      params: defaultParams,
    };

    setActiveIndicators((prev) => [...prev, instance]);
  }, []);

  const removeIndicator = useCallback((instanceId: string) => {
    setActiveIndicators((prev) => prev.filter((i) => i.instanceId !== instanceId));
  }, []);

  const updateParams = useCallback((instanceId: string, params: Record<string, number>) => {
    setActiveIndicators((prev) =>
      prev.map((i) => (i.instanceId === instanceId ? { ...i, params } : i))
    );
  }, []);

  return { activeIndicators, addIndicator, removeIndicator, updateParams };
}
