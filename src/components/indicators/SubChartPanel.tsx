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
  paneIndex: number
  }

export const SubChartPanel = ({
  indicator,
  candles,
  mainChartApi,
  onSeriesReady,
  paneIndex,
}: SubChartPanelProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const indicatorSeriesRef = useRef<ISeriesApi<"Line" | "Histogram">[]>([]);

  const def = getIndicatorById(indicator.definitionId);

  useEffect(() => {
    if (!containerRef.current || !def) return;

    chartRef.current = mainChartApi;
    return () => {
      const chart = chartRef.current;

      if (!chart) return;

      // guard: chart might already be disposed
      try {
        indicatorSeriesRef.current.forEach(s => {
          if (s && chart.panes().length > 0) {
            chart.removeSeries(s);
          }
        });
      } catch {
        // chart already destroyed → ignore
        console.warn("Removing indicators when chart alerady destroyed")
      }
      indicatorSeriesRef.current = [];
      // Notify parent series are gone
      onSeriesReady?.(indicator.instanceId, []);
      chartRef.current = null; 
    };
  }, [def]);

  // Sync time scale with main chart
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

  // Render indicator data
  useEffect(() => {
    if (!chartRef.current || !def || candles.length === 0) return;

    const seriesToRemove = indicatorSeriesRef.current;

    const output: IndicatorOutput = def.calculate(candles, indicator.params);
    const chart = chartRef.current;

    // const paneIndex = chart.panes().length;
    const newSeries: ISeriesApi<"Line" | "Histogram">[] = [];

    // Add line series
    for (const line of output.lines) {
      const series = chart.addSeries(LineSeries, {
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
          time: (Math.floor(new Date(d.time).getTime() / 1000)) as Time,
          value: d.value,
        }))
      );
      newSeries.push(series);
    }

    // Add histogram
    if (output.histogram) {
      let hSeries;
      hSeries = chart.addSeries(HistogramSeries, {
        priceScaleId: "right",
        priceLineVisible: false,
        lastValueVisible: false,
      }, paneIndex);
      
      hSeries.setData(
        output.histogram.data.map((d) => ({
          time: (Math.floor(new Date(d.time).getTime() / 1000)) as Time,
          value: d.value,
          color: d.color,
        }))
      );
      newSeries.push(hSeries);
    }

    indicatorSeriesRef.current = newSeries;

    try {
      seriesToRemove.forEach(s => {
        s.setData([]);
        chartRef.current?.removeSeries(s);
      });
    } catch {}

    // Notify parent of series refs for crosshair tracking
    onSeriesReady?.(indicator.instanceId, newSeries);

    // Fit content
    chart.timeScale().fitContent();

    // Sync initial range
    if (mainChartApi) {
      const range = mainChartApi.timeScale().getVisibleLogicalRange();
      if (range) {
        chart.timeScale().setVisibleLogicalRange(range);
      }
    }
  }, [candles, indicator.params, def]);

  if (!def) return null;

  return (
    <div ref={containerRef} />
  );
};
