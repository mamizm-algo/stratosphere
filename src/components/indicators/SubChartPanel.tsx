import { useEffect, useRef } from "react";
import {
  createChart,
  IChartApi,
  LineSeries,
  HistogramSeries,
  Time,
  LogicalRange,
} from "lightweight-charts";
import { ActiveIndicator, IndicatorOutput } from "@/lib/indicators/types";
import { getIndicatorById } from "@/lib/indicators/registry";
import { CandleData } from "@/components/chart/MockChartDisplay";
import { X } from "lucide-react";

interface SubChartPanelProps {
  indicator: ActiveIndicator;
  candles: CandleData[];
  mainChartApi: IChartApi | null;
  onRemove: (instanceId: string) => void;
}

export const SubChartPanel = ({
  indicator,
  candles,
  mainChartApi,
  onRemove,
}: SubChartPanelProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const def = getIndicatorById(indicator.definitionId);

  useEffect(() => {
    if (!containerRef.current || !def) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: "hsl(220, 25%, 8%)" },
        textColor: "hsl(215, 20%, 65%)",
      },
      grid: {
        vertLines: { color: "hsl(240, 3.7%, 15.9%)" },
        horzLines: { color: "hsl(240, 3.7%, 15.9%)" },
      },
      width: containerRef.current.clientWidth,
      height: 150,
      timeScale: {
        borderColor: "hsl(240, 3.7%, 15.9%)",
        timeVisible: true,
        secondsVisible: false,
        visible: false,
      },
      rightPriceScale: {
        borderColor: "hsl(240, 3.7%, 15.9%)",
      },
      handleScroll: false,
      handleScale: false,
      crosshair: { mode: 0 },
    });

    chartRef.current = chart;

    // Resize
    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.resize(containerRef.current.clientWidth, 150);
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
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

    const output: IndicatorOutput = def.calculate(candles, indicator.params);
    const chart = chartRef.current;

    // Clear existing series by recreating (simplest approach)
    // lightweight-charts doesn't have removeAllSeries, so we track internally
    // For simplicity, remove chart and recreate on data change is handled by key prop

    // Add line series
    for (const line of output.lines) {
      const series = chart.addSeries(LineSeries, {
        color: line.color,
        lineWidth: 2,
        priceScaleId: "right",
      });
      series.setData(
        line.data.map((d) => ({
          time: (Math.floor(new Date(d.time).getTime() / 1000)) as Time,
          value: d.value,
        }))
      );
    }

    // Add histogram
    if (output.histogram) {
      const hSeries = chart.addSeries(HistogramSeries, {
        priceScaleId: "right",
      });
      hSeries.setData(
        output.histogram.data.map((d) => ({
          time: (Math.floor(new Date(d.time).getTime() / 1000)) as Time,
          value: d.value,
          color: d.color,
        }))
      );
    }

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

  const paramStr = def.params.length > 0
    ? `(${def.params.map((p) => indicator.params[p.key]).join(",")})`
    : "";

  return (
    <div className="relative border-t border-border">
      <div className="absolute top-1 left-2 z-10 flex items-center gap-1">
        <span className="text-[10px] text-muted-foreground font-medium">
          {def.shortName}{paramStr}
        </span>
        <button
          onClick={() => onRemove(indicator.instanceId)}
          className="p-0.5 text-muted-foreground hover:text-destructive transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      <div ref={containerRef} className="w-full h-[150px]" />
    </div>
  );
};
