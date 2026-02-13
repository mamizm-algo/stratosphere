import { useState, useEffect, useRef, useMemo } from "react";
import { IChartApi, LineSeries, ISeriesApi, Time } from "lightweight-charts";
import { ActiveIndicator, IndicatorOutput } from "@/lib/indicators/types";
import { getIndicatorById } from "@/lib/indicators/registry";
import { CandleData } from "@/components/chart/MockChartDisplay";
import { IndicatorsButton } from "./IndicatorsButton";
import { IndicatorPickerDialog } from "./IndicatorPickerDialog";
import { ActiveIndicatorsList } from "./ActiveIndicatorsList";
import { IndicatorConfigDialog } from "./IndicatorConfigDialog";
import { SubChartPanel } from "./SubChartPanel";

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
  const overlaySeriesRef = useRef<Map<string, ISeriesApi<"Line">[]>>(new Map());

  let paneIndex = 1;

  const removeIndicator = (instanceId: string) => {
    console.log("panes", chartApi.panes.length)
    onRemove(instanceId);
  }

  // Separate overlay vs sub-chart indicators
  const overlayIndicators = useMemo(
    () => activeIndicators.filter((i) => getIndicatorById(i.definitionId)?.renderType === "overlay"),
    [activeIndicators]
  );
  const subChartIndicators = useMemo(
    () => activeIndicators.filter((i) => getIndicatorById(i.definitionId)?.renderType === "sub-chart"),
    [activeIndicators]
  );

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

      // Remove existing series for this instance to re-render
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

  // Config dialog state
  const configIndicator = configTarget
    ? activeIndicators.find((i) => i.instanceId === configTarget)
    : null;
  const configDef = configIndicator
    ? getIndicatorById(configIndicator.definitionId)
    : null;

  return (
    <>
      {/* Overlay UI (positioned absolute inside chart container) */}
      <IndicatorsButton onClick={() => setPickerOpen(true)} />
      <ActiveIndicatorsList
        indicators={activeIndicators}
        onRemove={removeIndicator}
        onConfigure={setConfigTarget}
      />

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

      {/* Sub-chart panels rendered below main chart */}
      {subChartIndicators.map((ind, i) =>(
        <SubChartPanel
          key={`${ind.instanceId}_${JSON.stringify(ind.definitionId)}`}
          indicator={ind}
          candles={candles}
          mainChartApi={chartApi}
          onRemove={removeIndicator}
        />
      ))}
    </>
  );
};
