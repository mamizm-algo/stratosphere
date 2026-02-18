import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { IChartApi, LineSeries, ISeriesApi, Time, HistogramSeries } from "lightweight-charts";
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
  const [labelGroups, setLabelGroups] = useState(null);

  const [crosshairValues, setCrosshairValues] = useState<CrosshairValues>({});
  const overlaySeriesRef = useRef<Map<string, ISeriesApi<"Line" | "Histogram">[]>>(new Map());
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

      const newSeries: ISeriesApi<"Line" | "Histogram">[] = [];
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
      if (def.id == "volume") {
        const series = chartApi.addSeries(HistogramSeries, {
          priceFormat: {
          type: 'volume', precision: 0, minMove: 1
        },
          priceScaleId: '',
          priceLineVisible: false,
          lastValueVisible: false,
        });
        series.priceScale().applyOptions({
            scaleMargins: {
                top: 0.85,
                bottom: 0,
            },
        });
        series.setData(
          output.histogram.data.map((d) => ({
            time: (Math.floor(new Date(d.time).getTime() / 1000)) as Time,
            value: d.value,
            color: d.color,
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

  const paneHeights = chartApi?.panes().map(pane => pane.getHeight().toString())
    .reduce((sum, height) => sum + height, "");
    
  useEffect(() => {
    if (!chartApi || !subChartSeriesRef.current) return;

    const calculatePaneOffsets = () => {
      let heightSoFar = 0;
      const subChartReverse = [...subChartIndicators].reverse();
      const groups = subChartReverse.map((ind, i) => {
        const paneIdx = subChartIndicators.length - i;
        const paneHeight = chartApi.panes()[paneIdx].getHeight();
        heightSoFar += paneHeight;
        return {
          paneIndex: paneIdx,
          indicator: ind,
          topOffset: heightSoFar,
        };
      });

      setLabelGroups(groups);
    }

    setTimeout(calculatePaneOffsets, 100);
  }, [chartApi, subChartIndicators, paneHeights]);


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
          style={{ top: 50 }}
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
      {subChartIndicators.map((ind, i) => (
        <div key={`${ind.instanceId}_${JSON.stringify(ind.definitionId)}`}>
          <PaneIndicatorLabel
            indicators={[ind]}
            crosshairValues={crosshairValues}
            onRemove={onRemove}
            onConfigure={setConfigTarget}
            style={{ bottom: labelGroups.find(group => group.indicator.instanceId == ind.instanceId)?.topOffset }}
          />
          <SubChartPanel
            indicator={ind}
            candles={candles}
            mainChartApi={chartApi}
            onSeriesReady={handleSeriesReady}
            paneIndex = {i+1}
          />
        </div>
      ))}
    </>
  );
};
