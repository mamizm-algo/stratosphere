import { useEffect, useRef } from "react";
import {
  IChartApi,
  LineSeries,
  HistogramSeries,
  Time,
  LogicalRange,
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
   * We track the series we created so we can swap them out on param changes.
   * We do NOT try to remove them when the chart is unmounted — the chart.remove()
   * call from the host component destroys all panes/series automatically.
   * Only remove series when WE are replacing them (param update) while the chart
   * is still alive.
   */
  const indicatorSeriesRef = useRef<ISeriesApi<"Line" | "Histogram">[]>([]);
  const chartRef = useRef<IChartApi | null>(null);

  const def = getIndicatorById(indicator.definitionId);

  // ─────────────────────────────────────────────────────────────────────────
  // Bind to the chart instance
  // When mainChartApi changes (new chart), we simply reset our refs.
  // The old series are already gone because the old chart was removed.
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    chartRef.current = mainChartApi;

    return () => {
      // The chart may or may not be alive here. Either way, the pane + its series
      // are cleaned up by chart.remove() in the host. We just clear our refs so
      // we don't accidentally reference stale series on the next render.
      indicatorSeriesRef.current = [];
      onSeriesReady?.(indicator.instanceId, []);
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainChartApi]);

  // ─────────────────────────────────────────────────────────────────────────
  // Sync time scale with main chart
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mainChartApi || !chartRef.current) return;

    const handler = (range: LogicalRange | null) => {
      if (range && chartRef.current) {
        chartRef.current.timeScale().setVisibleLogicalRange(range);
      }
    };

    mainChartApi.timeScale().subscribeVisibleLogicalRangeChange(handler);
    return () => {
      mainChartApi.timeScale().unsubscribeVisibleLogicalRangeChange(handler);
    };
  }, [mainChartApi]);

  // ─────────────────────────────────────────────────────────────────────────
  // Render / re-render indicator data
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !def || candles.length === 0) return;

    // Remove the previous series for this indicator (chart is still alive here —
    // this effect fires when params change, not when the chart is torn down).
    const old = indicatorSeriesRef.current;
    if (old.length > 0) {
      for (const s of old) {
        chart.removeSeries(s);
      }
      indicatorSeriesRef.current = [];
    }

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

    chart.timeScale().fitContent();

    if (mainChartApi) {
      const range = mainChartApi.timeScale().getVisibleLogicalRange();
      if (range) chart.timeScale().setVisibleLogicalRange(range);
    }
  }, [candles, indicator.params, def, mainChartApi, paneIndex]);

  if (!def) return null;

  return <div ref={containerRef} />;
};
