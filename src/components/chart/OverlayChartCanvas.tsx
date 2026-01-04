import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Line, Rect, Group, FabricObject } from "fabric";
import { CandleData } from "./MockChartDisplay";
import { Button } from "../ui/button";
import { ChartCandlestick, Trash2 } from "lucide-react";
import { ISeriesPrimitive, Time, Logical, IChartApi, IPrimitivePaneView, CandlestickSeries, createChart, CrosshairMode, ISeriesApi, MouseEventParams } from "lightweight-charts";




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

interface TransactionBoxModel {
  entryPrice: number;        // where profit & loss meet
  profitSize: number;        // height
  lossSize: number;          // height
  startLogical: Logical;     // left edge
  width: number;             // candles
  position: "long" | "short";
}


class TransactionBoxPrimitive implements ISeriesPrimitive<Time> {
 private chart: IChartApi;
  private series: ISeriesApi<"Candlestick">;
  private model: TransactionBoxModel;

  constructor(
    chart: IChartApi,
    series: ISeriesApi<"Candlestick">,
    model: TransactionBoxModel
  ) {
    this.chart = chart;
    this.series = series;
    this.model = model;
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
            const priceScale = this.chart.priceScale("right");

            const x1 = timeScale.logicalToCoordinate(this.model.startLogical);
            const x2 = timeScale.logicalToCoordinate(
              (this.model.startLogical + this.model.width) as Logical
            );

            if (x1 === null || x2 === null) return;

          const entryY = this.series.priceToCoordinate(this.model.entryPrice);
          if (entryY === null) return;

          const profitTop =
            this.model.position === "long"
              ? this.model.entryPrice + this.model.profitSize
              : this.model.entryPrice - this.model.profitSize;

          const lossBottom =
            this.model.position === "long"
              ? this.model.entryPrice - this.model.lossSize
              : this.model.entryPrice + this.model.lossSize;

          const profitY = this.series.priceToCoordinate(profitTop);
          const lossY = this.series.priceToCoordinate(lossBottom);
          if (profitY === null || lossY === null) return;


            ctx.save();

            // Profit zone
            ctx.fillStyle = "rgba(0, 200, 140, 0.25)";
            ctx.fillRect(
              x1,
              Math.min(entryY, profitY),
              x2 - x1,
              Math.abs(entryY - profitY)
            );

            // Loss zone
            ctx.fillStyle = "rgba(200,0,0,0.25)";
            ctx.fillRect(
              x1,
              Math.min(entryY, lossY),
              x2 - x1,
              Math.abs(entryY - lossY)
            );

            ctx.restore();
          });
        },
      }),
    }];
  }
}

interface OverlayChartCanvasProps {
  setupCandles: CandleData[];
  outcomesData: CandleData[][];
  chartType: "candle" | "line";
  onTransactionBoxChange?: (params: {
    takeProfit: number;
    stopLoss: number;
    timeHorizon: number;
    position: "long" | "short";
  } | null) => void;
  onEditTransaction?: () => void;
  initialTransactionBox?: {
    takeProfit: number;
    stopLoss: number;
    timeHorizon: number;
    position: "long" | "short";
  } | null;
}

export const OverlayChartCanvas = ({
  setupCandles,
  outcomesData,
  chartType,
  onTransactionBoxChange,
  onEditTransaction,
  initialTransactionBox,
}: OverlayChartCanvasProps) => {
  const [transactionBox, setTransactionBox] = useState<TransactionBoxModel | null>(null);
  const [drawMode, setDrawMode] = useState<"select" | "draw">("select");
  const chartRef = useRef<HTMLDivElement | null>(null);
  const chartApiRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);  
  const transactionPrimitiveRef = useRef<TransactionBoxPrimitive | null>(null);

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
  // ✅ make chart responsive
  rightPriceScale: { scaleMargins: { top: 0.1, bottom: 0.1 } },
  leftPriceScale: { visible: false },
  handleScroll: true,
  handleScale: true,
  // this tells lightweight-charts to fill the container
  width: chartRef.current.clientWidth,
  height: chartRef.current.clientHeight,
});

  const series = chart.addSeries(CandlestickSeries, {
    lastValueVisible: false,
    priceLineVisible: false,
});
const upColor = '#26a6992f';
const downColor = '#ef53502a';
  const outcomeSeries = outcomesData.map(outcome => chart.addSeries(CandlestickSeries, {
    upColor: upColor,
    downColor: downColor,
    borderVisible: false,
    wickUpColor: upColor,
    wickDownColor: downColor,
    lastValueVisible: false,
    priceLineVisible: false,
}));

  chartApiRef.current = chart;
  seriesRef.current = series;

  // setup candles
  const seriesData = [];
  let candleIndex = 0;
  const setupReferencePrice = setupCandles[setupCandles.length - 1].close;
  for (let i = 0; i < setupCandles.length; i++) {
    const c = setupCandles[i];
    seriesData.push({
      time: candleIndex++,
      open: c.open / setupReferencePrice * 100.0,
      high: c.high / setupReferencePrice * 100.0,
      low: c.low / setupReferencePrice * 100.0,
      close: c.close / setupReferencePrice * 100.0,
    });
  }
  seriesRef.current.setData(seriesData);

  // divider
  const dividerIndex = setupCandles.length;
  const primitive = new SetupOutcomeDividerPrimitive(
    chartApiRef.current!,
    dividerIndex as Logical
  );
  seriesRef.current!.attachPrimitive(primitive);
  
  // outcome candles
  for (let i = 0; i < outcomesData.length; i++) {
    const outcomeCandles = outcomesData[i];
    const seriesData = [];
    const outcomeReferencePrice = outcomeCandles[0].open;

     for (let i = 0; i < outcomeCandles.length; i++) {
      const c = outcomeCandles[i];
      seriesData.push({
        time: candleIndex+i,
        open: c.open / outcomeReferencePrice * 100.0,
        high: c.high / outcomeReferencePrice * 100.0,
        low: c.low / outcomeReferencePrice * 100.0,
        close: c.close / outcomeReferencePrice * 100.0,
      });
     }
    outcomeSeries[i].setData(seriesData);
  }
  
  return () => chart.remove();  // Combine both sets of candles
}, [setupCandles, outcomesData]);

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

// Transaction box
const handleTransactionButton = () => {
  if (drawMode === "select") {
    const chart = chartApiRef.current;
    const series = seriesRef.current;
    if (!chart || !series) return;

    setDrawMode("draw");

    const model: TransactionBoxModel = {
      entryPrice: 100,
      profitSize: 3,
      lossSize: 2,
      startLogical: setupCandles.length as Logical,
      width: 20,
      position: "long",
    };

    setTransactionBox(model)

    const primitive = new TransactionBoxPrimitive(chart, series, model);
    transactionPrimitiveRef.current = primitive;
    series.attachPrimitive(primitive);

    chart.applyOptions(chart.options()); // force first draw
  } else {
    const series = seriesRef.current;
    series.detachPrimitive(transactionPrimitiveRef.current);
    transactionPrimitiveRef.current = null;
    setDrawMode("select");
  }
};

const handleDeleteBox = () => {

}


  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant={drawMode === "draw" ? "default" : "outline"}
          size="sm"
          onClick={handleTransactionButton}
          className="gap-2"
        >
          {drawMode === "select" ?
          <ChartCandlestick className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />
          }
          {drawMode === "select" ?"Draw Transaction Box" : "Delete Box"}
        </Button>
      </div>
       <div
        ref={chartRef}
        className="w-full h-[600px]" // or h-full inside a flex container
      />
    </div>
  );
};
