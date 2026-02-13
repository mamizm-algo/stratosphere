import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { IChartApi, LineSeries, ISeriesApi, Time } from "lightweight-charts";
import { ActiveIndicator, IndicatorOutput } from "@/lib/indicators/types";
import { getIndicatorById } from "@/lib/indicators/registry";
import { CandleData } from "@/components/chart/MockChartDisplay";
import { IndicatorsButton } from "./IndicatorsButton";
import { IndicatorPickerDialog } from "./IndicatorPickerDialog";
import { IndicatorConfigDialog } from "./IndicatorConfigDialog";
import { SubChartPanel } from "./SubChartPanel";
import { PaneIndicatorLabel, CrosshairValues } from "./PaneIndicatorLabel";

interface IndicatorsLayerProps {
  chartApi: IChartApi | null;
  candles: CandleData[];
  activeIndicators: ActiveIndicator[];
  onAdd: (definitionId: string) => void;
  onRemove: (instanceId: string) => void;
  onUpdateParams: (instanceId: string, params: Record<string, number>) => void;
}

export const IndicatorsLayer = ({
  chartApi,
  candles,
  activeIndicators,
  onAdd,
  onRemove,
  onUpdateParams,
}: IndicatorsLayerProps) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [configTarget, setConfigTarget] = useState<string | null>(null);
  const [crosshairValues, setCrosshairValues] = useState<CrosshairValues>({});
  const [paneOffsets, setPaneOffsets] = useState<number[]>([]);
  const overlaySeriesRef = useRef<Map<string, ISeriesApi<"Line">[]>>(new Map());
  const subChartSeriesRef = useRef<Map<string, ISeriesApi<"Line" | "Histogram">[]>>(new Map());

  // Separate overlay vs sub-chart indicators
  const overlayIndicators = useMemo(
    () => activeIndicators.filter((i) => getIndicatorById(i.definitionId)?.renderType === "overlay"),
    [activeIndicators]
  );
  const subChartIndicators = useMemo(
    () => activeIndicators.filter((i) => getIndicatorById(i.definitionId)?.renderType === "sub-chart"),
    [activeIndicators]
  );

  // Callback for SubChartPanel to register its series
  const handleSeriesReady = useCallback((instanceId: string, series: ISeriesApi<"Line" | "Histogram">[]) => {
    if (series.length === 0) {
      subChartSeriesRef.current.delete(instanceId);
    } else {
      subChartSeriesRef.current.set(instanceId, series);
    }
  }, []);

  // Manage overlay series on the main chart
  useEffect(() => {
    if (!chartApi || candles.length === 0) return;

    // Remove old overlay series
    for (const [instanceId, seriesList] of overlaySeriesRef.current) {
      if (!overlayIndicators.find((i) => i.instanceId === instanceId)) {
        for (const s of seriesList) {
          try { chartApi.removeSeries(s); } catch {}
        }
        overlaySeriesRef.current.delete(instanceId);
      }
    }

    // Add/update overlay series
    for (const ind of overlayIndicators) {
      const def = getIndicatorById(ind.definitionId);
      if (!def) continue;

      const output: IndicatorOutput = def.calculate(candles, ind.params);

      const existing = overlaySeriesRef.current.get(ind.instanceId);
      if (existing) {
        for (const s of existing) {
          try { chartApi.removeSeries(s); } catch {}
        }
      }

      const newSeries: ISeriesApi<"Line">[] = [];
      for (const line of output.lines) {
        const series = chartApi.addSeries(LineSeries, {
          color: line.color,
          lineWidth: 2,
          priceScaleId: "right",
          priceLineVisible: false,
          lastValueVisible: false,
        });
        series.setData(
          line.data.map((d) => ({
            time: (Math.floor(new Date(d.time).getTime() / 1000)) as Time,
            value: d.value,
          }))
        );
        newSeries.push(series);
      }
      overlaySeriesRef.current.set(ind.instanceId, newSeries);
    }
  }, [chartApi, candles, overlayIndicators]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chartApi) {
        for (const seriesList of overlaySeriesRef.current.values()) {
          for (const s of seriesList) {
            try { chartApi.removeSeries(s); } catch {}
          }
        }
      }
      overlaySeriesRef.current.clear();
    };
  }, []);

  // Crosshair value tracking
  useEffect(() => {
    if (!chartApi) return;

    const handler = (param: any) => {
      const newValues: CrosshairValues = {};

      // Read overlay series values
      for (const [instanceId, seriesList] of overlaySeriesRef.current) {
        const ind = activeIndicators.find(i => i.instanceId === instanceId);
        if (!ind) continue;
        const def = getIndicatorById(ind.definitionId);
        if (!def) continue;

        const vals: Record<string, number | null> = {};
        seriesList.forEach((s, i) => {
          const lineKey = def.calculate(candles, ind.params).lines[i]?.key || `line_${i}`;
          const data = param.seriesData?.get(s);
          vals[lineKey] = data?.value ?? null;
        });
        newValues[instanceId] = vals;
      }

      // Read sub-chart series values
      for (const [instanceId, seriesList] of subChartSeriesRef.current) {
        const ind = activeIndicators.find(i => i.instanceId === instanceId);
        if (!ind) continue;
        const def = getIndicatorById(ind.definitionId);
        if (!def) continue;

        const output = def.calculate(candles, ind.params);
        const vals: Record<string, number | null> = {};
        let idx = 0;
        for (const line of output.lines) {
          const s = seriesList[idx];
          if (s) {
            const data = param.seriesData?.get(s);
            vals[line.key] = data?.value ?? null;
          }
          idx++;
        }
        if (output.histogram && seriesList[idx]) {
          const data = param.seriesData?.get(seriesList[idx]);
          vals["histogram"] = data?.value ?? null;
        }
        newValues[instanceId] = vals;
      }

      setCrosshairValues(newValues);
    };

    chartApi.subscribeCrosshairMove(handler);
    return () => {
      chartApi.unsubscribeCrosshairMove(handler);
    };
  }, [chartApi, activeIndicators, candles]);

  // Detect pane positions from DOM
  useEffect(() => {
    if (!chartApi) return;

    const detectPanes = () => {
      // lightweight-charts renders panes inside a table structure
      // We look for the chart container's internal pane elements
      const chartContainer = (chartApi as any)._private__chartWidget?._private__element
        || document.querySelector('.tv-lightweight-charts');
      
      if (!chartContainer) {
        // Fallback: use chart.panes() count and estimate positions
        const panes = chartApi.panes();
        if (panes.length <= 1) {
          setPaneOffsets([]);
          return;
        }
        // We can't reliably get pixel offsets without DOM inspection
        // Use the chart element's children to find pane separators
        const el = (chartApi as any).chartElement?.();
        if (el) {
          const rows = el.querySelectorAll('tr');
          const offsets: number[] = [];
          rows.forEach((row: HTMLElement) => {
            offsets.push(row.offsetTop);
          });
          setPaneOffsets(offsets);
        }
        return;
      }
    };

    // Detect on a short delay after renders
    const timer = setTimeout(detectPanes, 100);
    
    // Also observe for changes
    const observer = new MutationObserver(() => {
      setTimeout(detectPanes, 50);
    });

    const el = (chartApi as any).chartElement?.();
    if (el) {
      observer.observe(el, { childList: true, subtree: true });
    }

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [chartApi, subChartIndicators.length]);

  // Build pane mapping: which indicators go on which pane
  // Pane 0 = main chart (overlay indicators)
  // Pane 1+ = sub-chart indicators in order
  const paneIndicatorGroups = useMemo(() => {
    const groups: { paneIndex: number; indicators: ActiveIndicator[]; topOffset: number }[] = [];

    // Overlay indicators on pane 0
    if (overlayIndicators.length > 0) {
      groups.push({
        paneIndex: 0,
        indicators: overlayIndicators,
        topOffset: 36, // below the Indicators button
      });
    }

    // Sub-chart indicators each get their own pane
    subChartIndicators.forEach((ind, i) => {
      // Try to use detected pane offsets, otherwise estimate
      const paneIdx = i + 1;
      const offset = paneOffsets[paneIdx] ?? undefined;
      groups.push({
        paneIndex: paneIdx,
        indicators: [ind],
        topOffset: offset ?? 0,
      });
    });

    return groups;
  }, [overlayIndicators, subChartIndicators, paneOffsets]);

  // Config dialog state
  const configIndicator = configTarget
    ? activeIndicators.find((i) => i.instanceId === configTarget)
    : null;
  const configDef = configIndicator
    ? getIndicatorById(configIndicator.definitionId)
    : null;

  return (
    <>
      {/* Indicators button */}
      <IndicatorsButton onClick={() => setPickerOpen(true)} />

      {/* Overlay indicator labels (pane 0) */}
      {overlayIndicators.length > 0 && (
        <PaneIndicatorLabel
          indicators={overlayIndicators}
          crosshairValues={crosshairValues}
          onRemove={onRemove}
          onConfigure={setConfigTarget}
          style={{ top: 36 }}
        />
      )}

      {/* Picker dialog */}
      <IndicatorPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        activeIndicators={activeIndicators}
        onAdd={onAdd}
      />

      {/* Config dialog */}
      {configDef && configIndicator && (
        <IndicatorConfigDialog
          open={!!configTarget}
          onOpenChange={(open) => !open && setConfigTarget(null)}
          indicatorName={configDef.name}
          params={configDef.params}
          currentValues={configIndicator.params}
          onConfirm={(values) => onUpdateParams(configIndicator.instanceId, values)}
        />
      )}

      {/* Sub-chart panels with pane-aligned labels */}
      {subChartIndicators.map((ind) => (
        <div key={`${ind.instanceId}_${JSON.stringify(ind.definitionId)}`} className="relative">
          <PaneIndicatorLabel
            indicators={[ind]}
            crosshairValues={crosshairValues}
            onRemove={onRemove}
            onConfigure={setConfigTarget}
            style={{ top: 4 }}
          />
          <SubChartPanel
            indicator={ind}
            candles={candles}
            mainChartApi={chartApi}
            onRemove={onRemove}
            onSeriesReady={handleSeriesReady}
          />
        </div>
      ))}
    </>
  );
};
