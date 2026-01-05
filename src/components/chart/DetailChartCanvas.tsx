import { useEffect, useRef } from "react";
import { CandleData } from "./MockChartDisplay";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import {  CandlestickSeries, createChart, CrosshairMode, IChartApi, IPrimitivePaneView, ISeriesApi, ISeriesPrimitive, Logical, Time } from "lightweight-charts";
import { TransactionBoxModel } from "./SimilarityResults";


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


type HoverEdge = "profit" | "loss" | "left" | "right" | null;

class TransactionBoxPrimitive implements ISeriesPrimitive<Time> {
  private chart: IChartApi;
  private series: ISeriesApi<"Candlestick">;
  private model: TransactionBoxModel;
  private hoverEdge: HoverEdge = null;

  constructor(
    chart: IChartApi,
    series: ISeriesApi<"Candlestick">,
    model: TransactionBoxModel
  ) {
    this.chart = chart;
    this.series = series;
    this.model = model;
  }

  setHover(edge: HoverEdge) {
    this.hoverEdge = edge;
  }

  getModel() {
    return this.model;
  }

  update(patch: Partial<TransactionBoxModel>) {
    this.model = { ...this.model, ...patch };
  }

  paneViews(): IPrimitivePaneView[] {
    return [{
      renderer: () => ({
        draw: (target) => {
          target.useMediaCoordinateSpace(scope => {
            const ctx = scope.context;
            const timeScale = this.chart.timeScale();

            const x1 = timeScale.logicalToCoordinate(this.model.startLogical);
            const x2 = timeScale.logicalToCoordinate(
              (this.model.startLogical + this.model.duration) as Logical
            );
            if (x1 === null || x2 === null) return;

            const entryY = this.series.priceToCoordinate(this.model.entryPrice);
            if (entryY === null) return;

            const profitTop = this.model.entryPrice + this.model.profitSize;

            const lossBottom = this.model.entryPrice + this.model.lossSize;

            const profitY = this.series.priceToCoordinate(profitTop);
            const lossY = this.series.priceToCoordinate(lossBottom);
            if (profitY === null || lossY === null) return;

            ctx.save();

            // === zones ===
            ctx.fillStyle = "rgba(0, 200, 140, 0.25)";
            ctx.fillRect(x1, Math.min(entryY, profitY), x2 - x1, Math.abs(entryY - profitY));

            ctx.fillStyle = "rgba(200,0,0,0.25)";
            ctx.fillRect(x1, Math.min(entryY, lossY), x2 - x1, Math.abs(entryY - lossY));

            // === borders ===
            const drawLine = (
              active: boolean,
              draw: () => void
            ) => {
              ctx.strokeStyle = active ? "rgba(46, 111, 107,0.9)" : "rgba(255, 255, 255, 0)";
              ctx.lineWidth = active ? 3 : 1;
              ctx.beginPath();
              draw();
              ctx.stroke();
            };

            drawLine(this.hoverEdge != null, () => {
              ctx.moveTo(x1, profitY);
              ctx.lineTo(x2, profitY);
              ctx.moveTo(x1, lossY);
              ctx.lineTo(x2, lossY);
              ctx.moveTo(x1, profitY);
              ctx.lineTo(x1, lossY);
              ctx.moveTo(x2, profitY);
              ctx.lineTo(x2, lossY);
            });


            ctx.restore();
          });
        },
      }),
    }];
  }
}


interface DetailChartCanvasProps {
  setupCandles: CandleData[];
  outcomeCandles: CandleData[];
  chartType: "candle" | "line";
  onChartTypeChange?: (type: "candle" | "line") => void;
  transactionParams?: TransactionBoxModel | null;
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
  const transactionPrimitiveRef = useRef<TransactionBoxPrimitive | null>(null);
  
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

// transaction box
useEffect(() => {
  const chart = chartApiRef.current;
  const series = seriesRef.current;
  if (!chart || !series) return;

  if (transactionParams) {
    if (transactionPrimitiveRef.current) {
      const series = seriesRef.current;
      if (!transactionPrimitiveRef.current) return;

      series.detachPrimitive(transactionPrimitiveRef.current);
      transactionPrimitiveRef.current = null;
    }

    // convert from relative values to absolute for detail transaction view
    const openPrice = outcomeCandles[0].open;
    const profitSize = 
      openPrice * (1 + transactionParams.profitSize/100) - openPrice;
    const lossSize = 
      openPrice * (1 + transactionParams.lossSize/100) - openPrice;
     
    const detailTransaction: TransactionBoxModel = {
      entryPrice: openPrice,
      profitSize: profitSize,
      lossSize: lossSize,
      duration: transactionParams.duration,
      position: transactionParams.position,
      startLogical: transactionParams.startLogical
    }
    const primitive = new TransactionBoxPrimitive(chart, series, detailTransaction);
    transactionPrimitiveRef.current = primitive;
    series.attachPrimitive(primitive);
    
    chart.applyOptions(chart.options()); // force first draw
  } else {
    const series = seriesRef.current;
    if (!transactionPrimitiveRef.current) return;

    series.detachPrimitive(transactionPrimitiveRef.current);
    transactionPrimitiveRef.current = null;
    chart.applyOptions(chart.options()); // force first draw

  }
}, [transactionParams, setupCandles])


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