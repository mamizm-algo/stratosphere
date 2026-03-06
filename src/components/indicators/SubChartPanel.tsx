import { useEffect, useRef } from "react";
import {
  IChartApi,
  LineSeries,
  HistogramSeries,
  Time,
  ISeriesApi,
} from "lightweight-charts";
import { ActiveIndicator, IndicatorOutput } from "@/lib/indicators/types";
import { getIndicatorById } from "@/lib/indicators/registry";
import { CandleData } from "@/components/chart/MockChartDisplay";

interface SubChartPanelProps {
  indicator: ActiveIndicator;
  candles: CandleData[];
  mainChartApi: IChartApi | null;
  onSeriesReady?: (instanceId: string, series: ISeriesApi<"Line" | "Histogram">[]) => void;
  paneIndex: number;
}

export const SubChartPanel = ({
  indicator,
  candles,
  mainChartApi,
  onSeriesReady,
  paneIndex,
}: SubChartPanelProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Series currently rendered on the chart.
   */
  const indicatorSeriesRef = useRef<ISeriesApi<"Line" | "Histogram">[]>([]);

  /**
   * Whether the chart is being destroyed (mainChartApi went null or changed).
   * When true, we must NOT call removeSeries — the chart.remove() call in the
   * host component will clean up all series automatically.
   */
  const chartBeingDestroyedRef = useRef(false);

  const def = getIndicatorById(indicator.definitionId);

  // ─────────────────────────────────────────────────────────────────────────
  // Track chart lifecycle: set the "being destroyed" flag so the render effect
  // cleanup knows not to call removeSeries on a dead chart.
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    chartBeingDestroyedRef.current = false;

    return () => {
      // Fires when mainChartApi changes or component unmounts.
      // If mainChartApi is being replaced/nulled, the host calls chart.remove()
      // which wipes all series — we must not touch them.
      // If the component unmounts while the chart is still alive (indicator removed
      // by user), the render-effect cleanup below handles series removal.
      chartBeingDestroyedRef.current = true;
    };
  }, [mainChartApi]);

  // ─────────────────────────────────────────────────────────────────────────
  // Render / re-render indicator data. Cleanup removes series only when the
  // chart is still alive (param update or user-initiated indicator removal).
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const chart = mainChartApi;
    if (!chart || !def || candles.length === 0) return;

    // Remove old series (chart is alive — param/data update)
    const removeOld = () => {
      const old = indicatorSeriesRef.current;
      if (old.length === 0) return;
      for (const s of old) {
        try {
          chart.removeSeries(s);
        } catch {
          // Already gone — safe to ignore
        }
      }
      indicatorSeriesRef.current = [];
    };

    removeOld();

    const output: IndicatorOutput = def.calculate(candles, indicator.params);
    const newSeries: ISeriesApi<"Line" | "Histogram">[] = [];

    for (const line of output.lines) {
      const series = chart.addSeries(
        LineSeries,
        {
          color: line.color,
          lineWidth: 2,
          priceScaleId: "right",
          priceLineVisible: false,
          lastValueVisible: false,
        },
        paneIndex
      );
      series.setData(
        line.data.map((d) => ({
          time: Math.floor(new Date(d.time).getTime() / 1000) as Time,
          value: d.value,
        }))
      );
      newSeries.push(series);
    }

    if (output.histogram) {
      const hSeries = chart.addSeries(
        HistogramSeries,
        {
          priceScaleId: "right",
          priceLineVisible: false,
          lastValueVisible: false,
        },
        paneIndex
      );
      hSeries.setData(
        output.histogram.data.map((d) => ({
          time: Math.floor(new Date(d.time).getTime() / 1000) as Time,
          value: d.value,
          color: d.color,
        }))
      );
      newSeries.push(hSeries);
    }

    indicatorSeriesRef.current = newSeries;
    onSeriesReady?.(indicator.instanceId, newSeries);

    // Sync time range with the main chart
    const range = chart.timeScale().getVisibleLogicalRange();
    if (range) chart.timeScale().setVisibleLogicalRange(range);

    return () => {
      // This cleanup fires when candles/params change (we re-render above)
      // OR when the component unmounts (indicator removed by user).
      // In both cases, if the chart is being destroyed, skip — chart.remove()
      // handles it. Only remove series when the chart is still alive.
      if (chartBeingDestroyedRef.current) {
        indicatorSeriesRef.current = [];
        onSeriesReady?.(indicator.instanceId, []);
        return;
      }
      // Chart is alive — explicitly remove series (e.g. indicator was removed)
      const toRemove = indicatorSeriesRef.current;
      if (toRemove.length > 0) {
        for (const s of toRemove) {
          try {
            chart.removeSeries(s);
          } catch {
            // Already gone
          }
        }
        indicatorSeriesRef.current = [];
      }
      onSeriesReady?.(indicator.instanceId, []);
    };
  }, [candles, indicator.params, def, mainChartApi, indicator.definitionId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!def) return null;

  return <div ref={containerRef} />;
};
