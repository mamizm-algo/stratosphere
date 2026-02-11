import { memo, useEffect, useRef, useState } from "react";
import { CandleData } from "./MockChartDisplay";
import { Button } from "../ui/button";
import { Boxes, ChartCandlestick, MessageCircleQuestion, Trash2 } from "lucide-react";
import { ISeriesPrimitive, Time, Logical, IChartApi, IPrimitivePaneView, CandlestickSeries, createChart, CrosshairMode, ISeriesApi, MouseEventParams } from "lightweight-charts";
import { TransactionBoxModel } from "./SimilarityResults";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { totalmem } from "os";

const EDGE_TOLERANCE = 6;

function detectHoveredEdge(
  y: number,
  x: number,
  model: TransactionBoxModel,
  series: ISeriesApi<"Candlestick">,
  chart: IChartApi
): "profit" | "loss" | "width" | null { 
  const entryY = series.priceToCoordinate(model.entryPrice);
  if (entryY === null) return null;

  const profitPrice = model.entryPrice + model.profitSize;

  const lossPrice = model.entryPrice + model.lossSize;

  const profitY = series.priceToCoordinate(profitPrice);
  const lossY = series.priceToCoordinate(lossPrice);
  if (profitY === null || lossY === null) return null;
 
  const timeScale = chart.timeScale();
  const right = timeScale.logicalToCoordinate(
    (model.startLogical + model.duration) as Logical
  );

  const left = timeScale.logicalToCoordinate(model.startLogical) - EDGE_TOLERANCE;
  const top = Math.max(profitY, lossY) + EDGE_TOLERANCE;
  const bottom = Math.min(profitY, lossY) - EDGE_TOLERANCE;

  if (x < left || x > right + EDGE_TOLERANCE || y < bottom || y > top) {
    return null;
  }

  if (right !== null && Math.abs(x - right) < EDGE_TOLERANCE ) {
    return "width";
  }

  if (Math.abs(y - profitY) < EDGE_TOLERANCE) return "profit";
  if (Math.abs(y - lossY) < EDGE_TOLERANCE) return "loss";

  return null;
}



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
              const timeScale = this.chart.timeScale();


              const dividerXRight = timeScale.logicalToCoordinate(
                this.dividerLogical
              );
              const dividerXLeft = timeScale.logicalToCoordinate(
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

type HoverEdge = {
  active: boolean;
  edge: "profit" | "loss" | "width" | null;
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
    Object.assign(this.model, patch);
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

            const boxEndLeft = timeScale.logicalToCoordinate((this.model.startLogical + this.model.duration - 1) as Logical);
            const boxEndRight =timeScale.logicalToCoordinate((this.model.startLogical + this.model.duration) as Logical);
            const boxEnd = (boxEndLeft + boxEndRight) / 2;
            
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

            ctx.fillStyle = "rgba(0, 200, 140, 0.25)";
            ctx.strokeStyle = "rgba(0, 200, 140, 0.25)";

            ctx.lineWidth = 0.2;

            ctx.fillRect(left, entryY, width, profitHeight);
            ctx.strokeRect(left, entryY, width, profitHeight);

            ctx.fillStyle = "rgba(200,0,0,0.25)";
            ctx.strokeStyle =  "rgba(200,0,0,0.25)";

            ctx.lineWidth = 0.2;

            ctx.fillRect(left, entryY, width, lossHeight);
            ctx.strokeRect(left, entryY, width, lossHeight);

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
  initialTransactionParams: TransactionBoxModel;
  onTransactionBoxChange?: (params: TransactionBoxModel | null) => void;
}

export const OverlayChartCanvas = ({ 
  setupCandles,
  outcomesData,
  chartType,
  onTransactionBoxChange,
  initialTransactionParams
}: OverlayChartCanvasProps) => {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const chartApiRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);  
  const outcomeSeriesRef = useRef<ISeriesApi<"Candlestick"> [] | null>(null);  
  const transactionPrimitiveRef = useRef<TransactionBoxPrimitive | null>(null);
  const dragEdgeRef = useRef<HoverEdge>({active: false, edge: null});
  const [transactionBox, setTransactionBox] = useState<TransactionBoxModel | null>(initialTransactionParams);


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
        visible: false,

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

  const resultsCount = outcomesData.length;
  const minOpacity = 0.05;
  const maxOpacity = 0.2;
  const maxCount = 200; // cap for normalization
  const opacity =
    minOpacity +
    (1 - Math.min(resultsCount / maxCount, 1)) * (maxOpacity - minOpacity);
  const alphaHex = Math.round(opacity * 255)
    .toString(16)
    .padStart(2, "0");

  const UP_BASE = "#26a699";   // teal
  const DOWN_BASE = "#ef5350"; // red
  const upColor = `${UP_BASE}${alphaHex}`;
  const downColor = `${DOWN_BASE}${alphaHex}`;


  // const upColor = '#26a6992f';
  // const downColor = '#ef53502a';
  const outcomeSeries = outcomesData.map(outcome => chart.addSeries(CandlestickSeries, {
    upColor: upColor,
    downColor: downColor,
    borderVisible: false,
    wickUpColor: upColor,
    wickDownColor: downColor,
    lastValueVisible: false,
    priceLineVisible: false,
  }));

  // chart.timeScale().fitContent();

  chartApiRef.current = chart;
  seriesRef.current = series;
  outcomeSeriesRef.current = outcomeSeries;

  // setup candles
  const seriesData = [];
  let candleIndex = 0;
  const setupReferencePrice = setupCandles[setupCandles.length - 1].close;
  for (let i = 0; i < setupCandles.length; i++) {
    const c = setupCandles[i];
    seriesData.push({
      time: candleIndex++,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
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

     for (let i = 0; i < outcomeCandles.length; i++) {
      const c = outcomeCandles[i];
      seriesData.push({
        time: candleIndex+i,
        open: c.open, 
        high: c.high, 
        low: c.low, 
        close: c.close,
      });
     }
    outcomeSeries[i].setData(seriesData);
  }

  const fromTime = Math.floor(new Date(setupCandles[0].ctm).getTime() / 1000) as Time;
  const toTime = Math.floor(new Date(outcomesData[0][0].ctm).getTime() / 1000) as Time;

  if (fromTime && toTime) {
    chart.timeScale().setVisibleRange({
      from: 0 as Time,
      to: candleIndex + 80 as Time,
    });
  }
  
  return () => chart.remove(); 
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

useEffect(() => {
  const chart = chartApiRef.current;
  const outcomeSeries = outcomeSeriesRef.current[0];
  if (!chart || !outcomeSeries) return;

  // CREATE
  if (transactionBox && !transactionPrimitiveRef.current) {
    const primitive = new TransactionBoxPrimitive(
      chart,
      outcomeSeries,
      transactionBox
    );
    transactionPrimitiveRef.current = primitive;
    outcomeSeries.attachPrimitive(primitive);
    outcomeSeries.applyOptions({});
  }

  // DESTROY
  if (!transactionBox && transactionPrimitiveRef.current) {
    outcomeSeries.detachPrimitive(transactionPrimitiveRef.current);
    transactionPrimitiveRef.current = null;
  }
}, [transactionBox]);


useEffect(() => {
  const chart = chartApiRef.current;
  const container = chartRef.current;
  const primitive = transactionPrimitiveRef.current;
  const outcomeSeries = outcomeSeriesRef.current[0];

  if (!chart || !container || !primitive || !outcomeSeries) return;

  const model = primitive.getModel();

  const onPointerDown = (e: PointerEvent) => {
    
    const rect = container.getBoundingClientRect();

    const param: MouseEventParams = {
      point: {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      },
    } as any;

    const edge = detectHoveredEdge(param.point.y, param.point.x, model, outcomeSeries, chart);
    if (!edge) return;

    dragEdgeRef.current = { active: true, edge };

    // stop chart panning
     e.preventDefault();
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!dragEdgeRef.current.active) {
      return;
    }

    const edge = dragEdgeRef.current.edge;

    const rect = container.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const x = e.clientX - rect.left;

    if (edge === "width") {
      const logical = chart.timeScale().coordinateToLogical(x);
      if (logical != null) {
        // using update to prevent snapping to default chart settings (scale/zoom)
        primitive.update({
            duration: Math.max(1, logical - model.startLogical),
        });
      }
    } else {
      const price = outcomeSeries.coordinateToPrice(y);
      if (price == null) return;
      
      if (edge === "profit") {
        if (price !== null) {
          if (price > model.entryPrice) {
            primitive.update({
              profitSize: price - model.entryPrice,
              lossSize: -Math.abs(model.lossSize),
              position: "long"
            });
          } else {
            primitive.update({
              profitSize: price - model.entryPrice,
              lossSize: Math.abs(model.lossSize),
              position: "short"
            });
          }
        }
      }
      if (edge === "loss") {
        if (price !== null) {
          if (price < model.entryPrice) {
            primitive.update({
              profitSize: Math.abs(model.profitSize),
              lossSize: price - model.entryPrice,
              position: "long"
            });
          } else {
            primitive.update({
              profitSize: -Math.abs(model.profitSize),
              lossSize: price - model.entryPrice,
              position: "short"
            });
          }
        }
      }
    }
    outcomeSeries.applyOptions({});
  };

  const onPointerUp = () => {
    dragEdgeRef.current = { active: false, edge: null };
    // make a new reference to trigger stat calculation updates
    onTransactionBoxChange?.({...transactionPrimitiveRef.current.getModel()});
    setTransactionBox({...transactionPrimitiveRef.current.getModel()});
  };

  container.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);

  return () => {
    container.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
  };
}, [transactionBox]);


useEffect(() => {
  // detecting hover
  const chart = chartApiRef.current;
  const outcomeSeries = outcomeSeriesRef.current[0];
  const container = chartRef.current;
  const primitive = transactionPrimitiveRef.current;


  if (!chart || !outcomeSeries || !container ||!primitive) return;

  const model = primitive.getModel();


  const onCrosshairMove = (param: MouseEventParams) => {
    if (param.point && transactionPrimitiveRef.current) {
      const edge = detectHoveredEdge(param.point.y, param.point.x, model, outcomeSeries, chart);
      if (!edge) {
        container.style.cursor = "default"; 
        return;
      }
      if (edge === "width") container.style.cursor = "ew-resize";
      else if (edge) container.style.cursor = "ns-resize";
      else container.style.cursor = "default";
    }
    
  };

  chart.subscribeCrosshairMove(onCrosshairMove);
  return () => {
    chart.unsubscribeCrosshairMove(onCrosshairMove);
  };
}, [transactionBox]);


// Transaction box
const handleTransactionButton = () => {
  if (!transactionBox) {
    const duration = 20;
    const profitSize = 100 * Math.max(...outcomesData.map(outcome =>  Math.max(...outcome.slice(0, duration).map(outcomeCandle => outcomeCandle.high / outcome[0].open))))  - 100;
    
    const model: TransactionBoxModel = {
      entryPrice: setupCandles[setupCandles.length - 1].close,
      profitSize: profitSize,
      lossSize: -profitSize/2,
      startLogical: setupCandles.length as Logical,
      duration: duration,
      position: "long",
    };
    onTransactionBoxChange?.(model);
    setTransactionBox(model);

  } else {
    onTransactionBoxChange?.(null);
    setTransactionBox(null);
  }
};

  return (
    <div className="space-y-4">
   
      <div className="flex gap-2">
        {!transactionBox &&
        <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                   <Button
                    variant={transactionBox ? "default" : "outline"}
                    size="sm"
                    onClick={handleTransactionButton}
                    className="gap-2"
                  >
                    <ChartCandlestick className="w-4 h-4" /> 
                    Simulate trade
                    <MessageCircleQuestion className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>

                 <TooltipContent  side="top"
                          className="
                            max-w-xs
                            bg-background/95
                            border
                            border-primary/40
                            text-foreground
                            shadow-lg
                            backdrop-blur-sm
                          ">
                  <p className="text-sm leading-relaxed">  
                    Creates a default simulated trade by drawing a transaction box on the chart.
                  </p>
                  <p>
                    Trading statistics will be shown.
                  </p>
                </TooltipContent>
              </Tooltip>
          </TooltipProvider>
       
        }
        {transactionBox &&
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 ">
          <Button
          variant={transactionBox ? "default" : "outline"}
          size="sm"
          onClick={handleTransactionButton}
          className="gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Remove trade
        </Button>
                <div>
                   <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">Position</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                            <MessageCircleQuestion className="w-3 h-3" />
                        </TooltipTrigger>
                       <TooltipContent
                        side="top"
                        className="
                          max-w-xs
                          bg-background/95
                          border
                          border-primary/40
                          text-foreground
                          shadow-lg
                          backdrop-blur-sm
                        "
                      >
                        <p className="text-sm leading-relaxed">
                          Click and move the Take Profit or Stop Loss level to the other side of the opening price to change to{" "}
                          <span className="font-semibold text-primary">
                            {transactionBox.position === "long" ? "Short" : "Long"}
                          </span>
                        </p>
                      </TooltipContent>
                      </Tooltip>
                  </TooltipProvider>
                  </div>
                 
                  <p className="text-lg font-semibold capitalize">{transactionBox.position}</p>
                </div>
                <div>
                   <div className="flex items-center gap-2 ">
                    <p className="text-sm text-muted-foreground">Take Profit</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                            <MessageCircleQuestion className="w-3 h-3" />
                        </TooltipTrigger>
                        <TooltipContent  side="top"
                          className="
                            max-w-xs
                            bg-background/95
                            border
                            border-primary/40
                            text-foreground
                            shadow-lg
                            backdrop-blur-sm
                          ">
                          <p className="text-sm leading-relaxed">  
                            Click and move the Take Profit level on the transaction box to adjust
                          </p>
                        </TooltipContent>
                      </Tooltip>
                  </TooltipProvider>
                  </div>
                  <p className="text-lg font-semibold text-bullish">{Math.abs(transactionBox.profitSize).toFixed(2)}%</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 ">
                    <p className="text-sm text-muted-foreground">Stop Loss</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                            <MessageCircleQuestion className="w-3 h-3" />
                        </TooltipTrigger>
                         <TooltipContent  side="top"
                          className="
                            max-w-xs
                            bg-background/95
                            border
                            border-primary/40
                            text-foreground
                            shadow-lg
                            backdrop-blur-sm
                          ">
                          <p className="text-sm leading-relaxed">  
                            Click and move the Stop Loss level on the transaction box to adjust
                          </p>
                        </TooltipContent>
                      </Tooltip>
                  </TooltipProvider>
                  </div>
                  <p className="text-lg font-semibold text-bearish">{Math.abs(transactionBox.lossSize).toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Risk:Reward</p>
                  <p className="text-lg font-semibold">{Math.abs(transactionBox.profitSize/transactionBox.lossSize).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Trade duration</p>
                  <p className="text-lg font-semibold">{transactionBox.duration} candles</p>
                </div>
              </div>
        }
      </div>
      <div
        ref={chartRef}
        className="w-full h-[600px]"
      />
      </div>
  );
};
