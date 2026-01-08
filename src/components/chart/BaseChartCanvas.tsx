import { useEffect, useRef } from "react";
import { CandleData } from "./MockChartDisplay";
import { CandlestickSeries, createChart, CrosshairMode, IChartApi, ISeriesApi } from "lightweight-charts";

interface BaseChartCanvasProps {
  candles: CandleData[];
  chartType: "candle" | "line";
  onChartTypeChange?: (type: "candle" | "line") => void;
}

export const BaseChartCanvas = ({
  candles,
}: BaseChartCanvasProps) => {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const chartApiRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = createChart(chartRef.current, {
      layout: {
        background: { color: "hsl(220, 25%, 8%)" },
        textColor: "hsl(215, 20%, 65%)",
      },
      grid: {
        vertLines: { color: "hsl(240 3.7% 15.9%)" },
        horzLines: { color: "hsl(240 3.7% 15.9%)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      timeScale: {
        borderColor: "hsl(240 3.7% 15.9%)",
      },
      rightPriceScale: { scaleMargins: { top: 0.1, bottom: 0.1 } },
      leftPriceScale: { visible: false },
      handleScroll: true,
      handleScale: true,
      width: chartRef.current.clientWidth,
      height: chartRef.current.clientHeight,
    });

    const series = chart.addSeries(CandlestickSeries);

    chartApiRef.current = chart;
    seriesRef.current = series;

    return () => chart.remove();
  }, []);

  // Handle resize
  useEffect(() => {
    const chart = chartApiRef.current;
    if (!chart || !chartRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (chartRef.current) {
        chart.resize(
          chartRef.current.clientWidth,
          chartRef.current.clientHeight
        );
      }
    });

    resizeObserver.observe(chartRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Update data when candles change
  useEffect(() => {
    if (!seriesRef.current) return;

    const seriesData = candles.map((c) => ({
      time: new Date(c.ctm).getTime() / 1000,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    seriesRef.current.setData(seriesData as any);
  }, [candles]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-foreground">Base Chart (Search Input)</h4>
      </div>
      <div
        ref={chartRef}
        className="w-full h-[600px] rounded-lg border border-border overflow-hidden"
      />
    </div>
  );
};
