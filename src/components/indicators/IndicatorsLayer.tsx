import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { IChartApi, ISeriesApi } from "lightweight-charts";
import { ActiveIndicator } from "@/lib/indicators/types";
import { getIndicatorById } from "@/lib/indicators/registry";
import { CandleData } from "@/components/chart/MockChartDisplay";
import { IndicatorsButton } from "./IndicatorsButton";
import { IndicatorPickerDialog } from "./IndicatorPickerDialog";
import { IndicatorConfigDialog } from "./IndicatorConfigDialog";
import { SubChartPanel } from "./SubChartPanel";
import { PaneIndicatorLabel, CrosshairValues } from "./PaneIndicatorLabel";
import { ChartBinding } from "@/lib/indicators/ChartBinding";

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
  const [labelGroups, setLabelGroups] = useState<
    { paneIndex: number; indicator: ActiveIndicator; topOffset: number }[]
  >([]);

  /**
   * The binding is the single owner of all series on the current chart instance.
   * It is created when chartApi becomes non-null and disposed when chartApi changes
   * or when the component unmounts — while the chart is still alive.
   */
  const bindingRef = useRef<ChartBinding | null>(null);

  // Separate overlay vs sub-chart
  const overlayIndicators = useMemo(
    () =>
      activeIndicators.filter(
        (i) => getIndicatorById(i.definitionId)?.renderType === "overlay"
      ),
    [activeIndicators]
  );
  const subChartIndicators = useMemo(
    () =>
      activeIndicators.filter(
        (i) => getIndicatorById(i.definitionId)?.renderType === "sub-chart"
      ),
    [activeIndicators]
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Binding lifecycle: tied to chartApi identity
  // When chartApi changes (new chart instance), the old binding is disposed
  // (while the old chart is still alive), and a new binding is created.
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!chartApi) return;

    const binding = new ChartBinding(chartApi);
    bindingRef.current = binding;

    return () => {
      // Called synchronously before the next effect run (when chartApi changes)
      // or on unmount. The chart is still alive at this point because we received
      // the old chartApi in this closure — not the new one.
      binding.dispose();
      bindingRef.current = null;
      setCrosshairValues({});
    };
  }, [chartApi]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Sync overlay indicators whenever chart, candles, or overlay list changes
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const binding = bindingRef.current;
    if (!binding || candles.length === 0) return;
    binding.syncOverlays(overlayIndicators, candles);
  }, [chartApi, candles, overlayIndicators]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Crosshair subscription — recreated when chart, indicators, or candles change
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const binding = bindingRef.current;
    if (!binding) return;

    binding.subscribeCrosshair(activeIndicators, candles, setCrosshairValues);
    // No explicit unsub needed: subscribeCrosshair manages its own internal unsub,
    // and dispose() will clean everything up when the chart is torn down.
  }, [chartApi, activeIndicators, candles]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Sub-chart panel series registration
  // Called by SubChartPanel when its series are ready or removed
  // ─────────────────────────────────────────────────────────────────────────────
  const handleSeriesReady = useCallback(
    (instanceId: string, series: ISeriesApi<"Line" | "Histogram">[]) => {
      bindingRef.current?.registerSubSeries(instanceId, series);
    },
    []
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Pane offset calculation for label positioning
  // ─────────────────────────────────────────────────────────────────────────────
  const paneHeights = chartApi
    ?.panes()
    .map((p) => p.getHeight())
    .join(",");

  useEffect(() => {
    if (!chartApi || subChartIndicators.length === 0) return;

    const calculate = () => {
      const panes = chartApi.panes();
      let heightSoFar = 0;
      const groups = [...subChartIndicators].reverse().map((ind, i) => {
        const paneIdx = subChartIndicators.length - i;
        const pane = panes[paneIdx];
        if (!pane) return null;
        const paneHeight = pane.getHeight();
        heightSoFar += paneHeight;
        return { paneIndex: paneIdx, indicator: ind, topOffset: heightSoFar };
      });
      setLabelGroups(groups.filter(Boolean) as typeof labelGroups);
    };

    const timer = setTimeout(calculate, 100);
    return () => clearTimeout(timer);
  }, [chartApi, subChartIndicators, paneHeights]);

  // Config dialog
  const configIndicator = configTarget
    ? activeIndicators.find((i) => i.instanceId === configTarget)
    : null;
  const configDef = configIndicator
    ? getIndicatorById(configIndicator.definitionId)
    : null;

  return (
    <>
      <IndicatorsButton onClick={() => setPickerOpen(true)} />

      {/* Overlay indicator labels (pane 0) */}
      {overlayIndicators.length > 0 && (
        <PaneIndicatorLabel
          indicators={overlayIndicators}
          crosshairValues={crosshairValues}
          onRemove={onRemove}
          onConfigure={setConfigTarget}
          style={{ top: 50 }}
        />
      )}

      <IndicatorPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        activeIndicators={activeIndicators}
        onAdd={onAdd}
      />

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

      {/* Sub-chart panels + pane-aligned labels */}
      {subChartIndicators.map((ind, i) => (
        <div key={ind.instanceId}>
          <PaneIndicatorLabel
            indicators={[ind]}
            crosshairValues={crosshairValues}
            onRemove={onRemove}
            onConfigure={setConfigTarget}
            style={{
              bottom:
                labelGroups.find(
                  (g) => g.indicator.instanceId === ind.instanceId
                )?.topOffset,
            }}
          />
          <SubChartPanel
            indicator={ind}
            candles={candles}
            mainChartApi={chartApi}
            onSeriesReady={handleSeriesReady}
            paneIndex={i + 1}
          />
        </div>
      ))}
    </>
  );
};
