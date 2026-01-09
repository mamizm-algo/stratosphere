import { useEffect, useRef, useState } from "react";
import { CandleData } from "./MockChartDisplay";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import {  CandlestickData, CandlestickSeries, createChart, CrosshairMode, IChartApi, IPrimitivePaneView, ISeriesApi, ISeriesPrimitive, Logical, Time } from "lightweight-charts";
import { TransactionBoxModel } from "./SimilarityResults";
import { Checkbox } from "../ui/checkbox";
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils";



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

              const dividerXRight = this.chart.timeScale().logicalToCoordinate(
                this.dividerLogical
              );
              const dividerXLeft = this.chart.timeScale().logicalToCoordinate(
                this.dividerLogical-1 as Logical
              );

              const dividerX = (dividerXLeft + dividerXRight) / 2;

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
            
            const boxStartLeft = timeScale.logicalToCoordinate(this.model.startLogical - 1 as Logical);
            const boxStartRight = timeScale.logicalToCoordinate(this.model.startLogical as Logical);
            const boxStart = (boxStartLeft + boxStartRight) / 2;

            const boxEnd = timeScale.logicalToCoordinate((this.model.startLogical + this.model.duration) as Logical);
            
            const entryY = this.series.priceToCoordinate(this.model.entryPrice);

            if (entryY === null) return;

            const profitPrice = this.model.entryPrice + this.model.profitSize;
            const lossPrice = this.model.entryPrice + this.model.lossSize;

            const profitY = this.series.priceToCoordinate(profitPrice);
            const lossY = this.series.priceToCoordinate(lossPrice);
            if (profitY === null || lossY === null) return;

            ctx.save();

            const left = boxStart;
            const width = Math.abs(boxEnd - boxStart);
            const profitHeight = profitY - entryY;
            const lossHeight = lossY - entryY;

            ctx.lineWidth = 0;
            ctx.fillStyle = "rgba(0, 200, 140, 0.25)";

            ctx.fillRect(left, entryY, width, profitHeight);
            ctx.strokeRect(left, entryY, width, profitHeight);

            ctx.lineWidth = 0;
            ctx.fillStyle = "rgba(200,0,0,0.25)";

            ctx.fillRect(left, entryY, width, lossHeight);
            ctx.strokeRect(left, entryY, width, lossHeight);

            ctx.restore();
          });
        },
      }),
    }];
  }
}


interface DetailChartCanvasProps {
  baseChart: CandleData[]; 
  setupCandles: CandleData[];
  outcomeCandles: CandleData[];
  chartType: "candle" | "line";
  onChartTypeChange?: (type: "candle" | "line") => void;
  transactionParams?: TransactionBoxModel | null;
}

export const DetailChartCanvas = ({
  baseChart,
  setupCandles,
  outcomeCandles,
  chartType,
  onChartTypeChange,
  transactionParams,
}: DetailChartCanvasProps) => {
const chartRef = useRef<HTMLDivElement | null>(null);
const chartApiRef = useRef<IChartApi | null>(null);
const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
const baseChartSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
const selectionPrimitiveRef = useRef<SetupOutcomeDividerPrimitive | null>(null);
const transactionPrimitiveRef = useRef<TransactionBoxPrimitive | null>(null);
const [showBaseChart, setShowBaseChart] = useState<boolean>(true);
const [baseGhostChart, setBaseGhostChart] = useState<CandlestickData<Time> [] | null>(null);


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
  // make chart responsive
  rightPriceScale: { scaleMargins: { top: 0.1, bottom: 0.1 } },
  leftPriceScale: { visible: false },
  handleScroll: true,
  handleScale: true,
  // this tells lightweight-charts to fill the container
  width: chartRef.current.clientWidth,
  height: chartRef.current.clientHeight,
});

  const series = chart.addSeries(CandlestickSeries);
  
  const upColor = '#26a69952';
  const downColor = '#ef535054';
  const baseChartSeries = chart.addSeries(CandlestickSeries, {
    upColor: upColor,
    downColor: downColor,
    borderVisible: false,
    wickUpColor: upColor,
    wickDownColor: downColor,
    lastValueVisible: false,
    priceLineVisible: false,
});

  chartApiRef.current = chart;
  seriesRef.current = series;
  baseChartSeriesRef.current = baseChartSeries;

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

  // ghost base chart
  useEffect(() => {
    if (!baseChartSeriesRef.current || !chartApiRef.current) return;

    // align to outcome open
    const seriesData = [];
    const baseReferenceCandleClose = baseChart[baseChart.length - 1].close;
    const setupReferenceCandleClose = setupCandles[setupCandles.length - 1].close;
    for (let i = 1; i <= baseChart.length; i++) {
      const baseCandle = baseChart[baseChart.length - i];
      const setupCandle = setupCandles[setupCandles.length - i];
      seriesData.push({
        time: new Date(setupCandle.ctm).getTime(),
        open: baseCandle.open / baseReferenceCandleClose * setupReferenceCandleClose,
        high: baseCandle.high / baseReferenceCandleClose * setupReferenceCandleClose,
        low: baseCandle.low / baseReferenceCandleClose * setupReferenceCandleClose,
        close: baseCandle.close / baseReferenceCandleClose * setupReferenceCandleClose,
      })
    }
    setBaseGhostChart(seriesData.reverse());
    if (showBaseChart) {
      baseChartSeriesRef.current.setData(seriesData);
    }
  }, [setupCandles, outcomeCandles]);

  // ghost base chart
  useEffect(() => {
    if (!baseChartSeriesRef.current || !chartApiRef.current) return;

    if (showBaseChart && baseGhostChart) {
      baseChartSeriesRef.current.setData(baseGhostChart);
    } else {
      baseChartSeriesRef.current.setData([]);
    }
  }, [showBaseChart, baseGhostChart]);

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
          <div className="flex gap-2">
            {/* <div
              key="showGhostBaseChart"
              className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
            >
              <label
                htmlFor="showGhostBaseChart"
                className="text-sm font-medium leading-none cursor-pointer flex-1"
              >
                Show base chart
              </label>
              <Checkbox
                id="showGhostBaseChart"
                checked={showBaseChart}
                onCheckedChange={() => {setShowBaseChart(!showBaseChart)}} 
              />
            </div> */}
            <div
              className={cn(
                "flex items-center space-x-2 p-y-1 px-3 rounded-lg border transition-colors",
                showBaseChart
                  ? "bg-secondary/40 border-primary/40"
                  : "border-border hover:bg-secondary/50"
              )}
            >
              <label
                htmlFor="showGhostBaseChart"
                className="text-sm font-medium leading-none cursor-pointer flex-1"
              >
                Show base chart
              </label>

              <Switch
                id="showGhostBaseChart"
                checked={showBaseChart}
                onCheckedChange={setShowBaseChart}
              />
            </div>

            
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
        </div>
      )}
      <div
        ref={chartRef}
        className="w-full h-[600px]" // or h-full inside a flex container
      />
    </div>
  );
};