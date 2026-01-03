import { useEffect, useRef } from "react";
import { CandleData } from "./MockChartDisplay";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import {  CandlestickSeries, createChart, CrosshairMode, IChartApi, IPrimitivePaneView, ISeriesApi, ISeriesPrimitive, Logical, Time } from "lightweight-charts";


class SetupOutcomeDividerPrimitive implements ISeriesPrimitive<Time> {
  private dividerLogical: Logical;
  private chart: IChartApi;

  constructor(chart: IChartApi, dividerLogical: Logical) {
    this.chart = chart;
    this.dividerLogical = dividerLogical;
  }

  paneViews(): IPrimitivePaneView[] {
    return [
      {
        renderer: () => ({
          draw: (target) => {
            target.useMediaCoordinateSpace((scope) => {
              const ctx = scope.context;
              const height = scope.mediaSize.height;

              const dividerX = this.chart.timeScale().logicalToCoordinate(
                this.dividerLogical
              );

              if (dividerX === null) return;

              ctx.save();
              ctx.strokeStyle = "rgba(80,160,255,0.9)";
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(dividerX, 0);
              ctx.lineTo(dividerX, height);
              ctx.stroke();
              ctx.restore();
            });
          },
        }),
      },
    ];
  }
}


interface DetailChartCanvasProps {
  setupCandles: CandleData[];
  outcomeCandles: CandleData[];
  chartType: "candle" | "line";
  onChartTypeChange?: (type: "candle" | "line") => void;
  transactionParams?: {
    takeProfit: number;
    stopLoss: number;
    timeHorizon: number;
    position: "long" | "short";
  } | null;
}

export const DetailChartCanvas = ({
  setupCandles,
  outcomeCandles,
  chartType,
  onChartTypeChange,
  transactionParams,
}: DetailChartCanvasProps) => {
const chartRef = useRef<HTMLDivElement | null>(null);
const chartApiRef = useRef<IChartApi | null>(null);
const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
const selectionPrimitiveRef = useRef<SetupOutcomeDividerPrimitive | null>(null);
  
useEffect(() => {
  if (!chartRef.current) return;

  const chart = createChart(chartRef.current, {
  // width: 900,
  // height: 500,
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
  // ✅ make chart responsive
  rightPriceScale: { scaleMargins: { top: 0.1, bottom: 0.1 } },
  leftPriceScale: { visible: false },
  handleScroll: true,
  handleScale: true,
  // this tells lightweight-charts to fill the container
  width: chartRef.current.clientWidth,
  height: chartRef.current.clientHeight,
});

  const series = chart.addSeries(CandlestickSeries);

  chartApiRef.current = chart;
  seriesRef.current = series;

  return () => chart.remove();
}, []);

useEffect(() => {
  const chart = chartApiRef.current;
  if (!chart) return;

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



useEffect(() => {
  if (!seriesRef.current || !chartApiRef.current) return;

  // Combine both sets of candles
  const allCandles = setupCandles.concat(outcomeCandles);
  const seriesData = allCandles.map((c) => ({
    time: new Date(c.ctm).getTime(),
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
  }));
  seriesRef.current.setData(seriesData);

  if (selectionPrimitiveRef.current) {
    seriesRef.current.detachPrimitive(selectionPrimitiveRef.current);
  }

  const dividerIndex = setupCandles.length; // e.g., first candle of outcomeCandles
  const primitive = new SetupOutcomeDividerPrimitive(
      chartApiRef.current!,
      dividerIndex as Logical
  );
  seriesRef.current!.attachPrimitive(primitive);
  selectionPrimitiveRef.current = primitive;
}, [setupCandles, outcomeCandles]);


  return (
    <div className="space-y-4">
      {onChartTypeChange && (
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold text-foreground">Setup + Outcome Chart</h4>
          <Select value={chartType} onValueChange={(v) => onChartTypeChange(v as "candle" | "line")}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="candle">Candles</SelectItem>
              <SelectItem value="line">Line</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <div
        ref={chartRef}
        className="w-full h-[600px]" // or h-full inside a flex container
      />
    </div>
  );
};