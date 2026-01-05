import { useEffect, useRef, useState } from "react";
import { CandleData } from "./MockChartDisplay";
import { Button } from "../ui/button";
import { ChartCandlestick, MessageCircleQuestion, Trash2 } from "lucide-react";
import { ISeriesPrimitive, Time, Logical, IChartApi, IPrimitivePaneView, CandlestickSeries, createChart, CrosshairMode, ISeriesApi, MouseEventParams } from "lightweight-charts";
import { TransactionBoxModel } from "./SimilarityResults";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

const EDGE_TOLERANCE = 6;

function detectHoveredEdge(
  y: number,
  x: number,
  model: TransactionBoxModel,
  series: ISeriesApi<"Candlestick">,
  chart: IChartApi
): HoverEdge {
  const entryY = series.priceToCoordinate(model.entryPrice);
  if (entryY === null) return null;

  const profitPrice = model.entryPrice + model.profitSize;

  const lossPrice = model.entryPrice + model.lossSize;

  const profitY = series.priceToCoordinate(profitPrice);
  const lossY = series.priceToCoordinate(lossPrice);
  if (profitY === null || lossY === null) return null;
 
  const timeScale = chart.timeScale();
  const x2 = timeScale.logicalToCoordinate(
    (model.startLogical + model.duration) as Logical
  );

  if (x2 !== null && Math.abs(x - x2) < EDGE_TOLERANCE) {
    return "right";
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

interface OverlayChartCanvasProps {
  setupCandles: CandleData[];
  outcomesData: CandleData[][];
  chartType: "candle" | "line";
  onTransactionBoxChange?: (params: TransactionBoxModel | null) => void;
  onEditTransaction?: () => void;
  transactionBox?: TransactionBoxModel | null;
}

export const OverlayChartCanvas = ({
  setupCandles,
  outcomesData,
  chartType,
  onTransactionBoxChange,
  transactionBox
}: OverlayChartCanvasProps) => {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const chartApiRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);  
  const transactionPrimitiveRef = useRef<TransactionBoxPrimitive | null>(null);
  const hoverEdgeRef = useRef<HoverEdge>(null);
  const dragEdgeRef = useRef<HoverEdge>(null);
  const isDraggingRef = useRef(false);

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

useEffect(() => {
  const chart = chartApiRef.current;
  const series = seriesRef.current;
  if (!chart || !series) return;

  if (transactionBox) {
    const primitive = new TransactionBoxPrimitive(chart, series, transactionBox);
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
}, [transactionBox])

useEffect(() => {
  // detecting hover
  const chart = chartApiRef.current;
  const series = seriesRef.current;
  const container = chartRef.current;


  if (!chart || !series || !container) return;

  const onCrosshairMove = (param: MouseEventParams) => {
    if (!param.point || !transactionPrimitiveRef.current) {
      hoverEdgeRef.current = null;
      container.style.cursor = "default";
      return;
    }

    const model = transactionPrimitiveRef.current.getModel();

    const edge = detectHoveredEdge(
      param.point.y,
      param.point.x,
      model,
      series,
      chart
    );

    hoverEdgeRef.current = edge;

    if (edge === "right") container.style.cursor = "ew-resize";
    else if (edge) container.style.cursor = "ns-resize";
    else container.style.cursor = "default";

    transactionPrimitiveRef.current.setHover(edge);

    chart.applyOptions({});
  };

  chart.subscribeCrosshairMove(onCrosshairMove);
  return () => {
    chart.unsubscribeCrosshairMove(onCrosshairMove);
  };
}, [transactionBox]);


useEffect(() => {
  // start editing
  const chart = chartApiRef.current;
  if (!chart) return;


  const onClick = () => {
    if (!hoverEdgeRef.current) return;
    if (!dragEdgeRef.current) {


      dragEdgeRef.current = hoverEdgeRef.current;
      isDraggingRef.current = true;

      // disable chart interaction
      chart.applyOptions({
        handleScroll: false,
        handleScale: false,
      });
    } else {
      dragEdgeRef.current = null;
      isDraggingRef.current = false;
      onTransactionBoxChange(transactionPrimitiveRef.current.getModel());
      chart.applyOptions({
        handleScroll: true,
        handleScale: true,
      });
    }
  };

  chart.subscribeClick(onClick);
  return () => chart.unsubscribeClick(onClick);
}, [transactionBox]);


useEffect(() => {
  // update transaction box when moving cursor
  const chart = chartApiRef.current;
  const series = seriesRef.current;
  const primitive = transactionPrimitiveRef.current;
  if (!chart || !series || !primitive) return;

  const HIT = 6;

  const onMove = (param: MouseEventParams) => {
    if (!param.point || !param.logical) return;

    const { x, y } = param.point;
    const model = primitive.getModel();

    const entryY = series.priceToCoordinate(model.entryPrice);
    if (entryY === null) return;

    const profitY = series.priceToCoordinate(
      model.entryPrice + model.profitSize
       
    );
    const lossY = series.priceToCoordinate(
     model.entryPrice + model.lossSize
    );

    const x1 = chart.timeScale().logicalToCoordinate(model.startLogical);
    const x2 = chart.timeScale().logicalToCoordinate(
      (model.startLogical + model.duration) as Logical
    );

    let hover: HoverEdge = null;

    if (profitY !== null && Math.abs(y - profitY) < HIT) hover = "profit";
    else if (lossY !== null && Math.abs(y - lossY) < HIT) hover = "loss";
    else if (x1 !== null && Math.abs(x - x1) < HIT) hover = "left";
    else if (x2 !== null && Math.abs(x - x2) < HIT) hover = "right";

    primitive.setHover(hover);

    if (isDraggingRef.current && dragEdgeRef.current) {
      const primitive = transactionPrimitiveRef.current!;
      const model = primitive.getModel();

      if (dragEdgeRef.current === "right") {
        const logical = chart.timeScale().coordinateToLogical(param.point.x);
        if (logical !== null) {
          primitive.update({
            duration: Math.max(1, logical - model.startLogical),
          });
        }
      }

      if (dragEdgeRef.current === "profit") {
        const price = series.coordinateToPrice(param.point.y);
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

      if (dragEdgeRef.current === "loss") {
        const price = series.coordinateToPrice(param.point.y);
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

    chart.applyOptions({});
  };

  chart.subscribeCrosshairMove(onMove);

  return () => chart.unsubscribeCrosshairMove(onMove);
}, [transactionBox]);


// Transaction box
const handleTransactionButton = () => {
  if (!transactionBox) {
    const duration = 20;
    const profitSize = 100 * Math.max(...outcomesData.map(outcome =>  Math.max(...outcome.slice(0, duration).map(outcomeCandle => outcomeCandle.high)))) / outcomesData[0][0].open - 100;
    
    const model: TransactionBoxModel = transactionBox || {
      entryPrice: 100,
      profitSize: profitSize,
      lossSize: -profitSize/2,
      startLogical: setupCandles.length as Logical,
      duration: duration,
      position: "long",
    };
    onTransactionBoxChange(model);
  } else {
    onTransactionBoxChange(null);
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

                <TooltipContent>
                  <p>
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
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
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
                   <div className="flex items-center gap-2 ">
                    <p className="text-sm text-muted-foreground">Position</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                            <MessageCircleQuestion className="w-3 h-3" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Click and move the Take Profit or Stop Loss level to the other side of the opening price to change to {transactionBox.position == "long" ? "Short" : "Long"}
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
                        <TooltipContent>
                          <p>
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
                        <TooltipContent>
                          <p>
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
