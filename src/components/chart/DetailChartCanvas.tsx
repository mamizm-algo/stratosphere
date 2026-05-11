import { useEffect, useRef, useState, useMemo } from "react";
import { CandleData } from "./MockChartDisplay";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import {  CandlestickData, CandlestickSeries, createChart, CrosshairMode, HistogramSeries, IChartApi, IPrimitivePaneView, ISeriesApi, ISeriesPrimitive, Time } from "lightweight-charts";
import { TransactionBoxModel } from "./SimilarityResults";
import { Checkbox } from "../ui/checkbox";
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils";
import { IndicatorsLayer } from "../indicators/IndicatorsLayer";
import { useIndicators } from "@/hooks/useIndicators";
import { aggregateCandles } from "@/lib/candle-aggregation";
import { TimeframeButton, Timeframe } from "./TimeframeButton";
import { Button } from "../ui/button";



class SetupOutcomeDividerPrimitive implements ISeriesPrimitive<Time> {
  private dividerTime: Time;
  private chart: IChartApi;

  constructor(chart: IChartApi, dividerTime: Time) {
    this.chart = chart;
    this.dividerTime = dividerTime;
  }

  paneViews(): IPrimitivePaneView[] {
    return [
      {
        renderer: () => ({
          draw: (target) => {
            target.useMediaCoordinateSpace((scope) => {
              const ctx = scope.context;
              const height = scope.mediaSize.height;

              const dividerX = this.chart.timeScale().timeToCoordinate(this.dividerTime);

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

  constructor(
    chart: IChartApi,
    series: ISeriesApi<"Candlestick">,
    model: TransactionBoxModel
  ) {
    this.chart = chart;
    this.series = series;
    this.model = model;
  }

  paneViews(): IPrimitivePaneView[] {
    return [{
       renderer: () => ({
        draw: (target) => {
          target.useMediaCoordinateSpace(scope => {
            const ctx = scope.context;
            const timeScale = this.chart.timeScale();
            
            const boxStart = timeScale.timeToCoordinate(this.model.startTime);
            const boxEnd = timeScale.timeToCoordinate(this.model.endTime);
            const entryY = this.series.priceToCoordinate(this.model.entryPrice);

            if (boxStart === null || boxEnd === null || entryY === null) return;

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
  const { activeIndicators, addIndicator, removeIndicator, updateParams } = useIndicators();
  const [chartApi, setChartApi] = useState<IChartApi | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>("1m");

  // Aggregate candles based on selected timeframe
  const aggregatedCandles = useMemo(() => {
    const allCandles = setupCandles.concat(outcomeCandles);
    if (timeframe === "1m") return allCandles;
    const timeframeMinutes = parseInt(timeframe);
    return aggregateCandles(allCandles, timeframeMinutes);
  }, [setupCandles, outcomeCandles, timeframe]);

  const aggregatedSetupCandles = useMemo(() => {
    if (timeframe === "1m") return setupCandles;
    const timeframeMinutes = parseInt(timeframe);
    return aggregateCandles(setupCandles, timeframeMinutes);
  }, [setupCandles, timeframe]);

  const aggregatedBaseChart = useMemo(() => {
    if (timeframe === "1m") return baseChart;
    const timeframeMinutes = parseInt(timeframe);
    return aggregateCandles(baseChart, timeframeMinutes);
  }, [baseChart, timeframe]);

  // Calculate divider timestamp: when the setup/outcome split occurs
  // Use aggregated setup candles so divider aligns with displayed candles
  const dividerTime = useMemo(() => {
    if (aggregatedSetupCandles.length === 0) return 0 as Time;
    const lastSetupCandle = aggregatedSetupCandles[aggregatedSetupCandles.length - 1];
    return Math.floor(new Date(lastSetupCandle.ctm).getTime() / 1000) as Time;
  }, [aggregatedSetupCandles]);

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
        timeVisible: true,     // show HH:mm
        secondsVisible: false // optional (true for tick-level data)
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

    chart.timeScale().fitContent();

    chartApiRef.current = chart;
    seriesRef.current = series;
    baseChartSeriesRef.current = baseChartSeries;

    // Expose to React state so IndicatorsLayer re-renders with the new instance
    setChartApi(chart);

    return () => {
      setChartApi(null);
      chart.remove();
    };
  }, [setupCandles, outcomeCandles]);

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



  // const allCandles = aggregatedSetupCandles.concat(aggregatedOutcomeCandles);
  useEffect(() => {
    if (!seriesRef.current || !chartApiRef.current) return;

    // Combine both sets of candles
    const seriesData = aggregatedCandles.map((c) => ({
      time: Math.floor(new Date(c.ctm).getTime() / 1000) as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    seriesRef.current.setData(seriesData as CandlestickData<Time>[]);

    if (selectionPrimitiveRef.current) {
      seriesRef.current.detachPrimitive(selectionPrimitiveRef.current);
    }

    if (dividerTime !== (0 as Time)) {
      const primitive = new SetupOutcomeDividerPrimitive(
          chartApiRef.current!,
          dividerTime
      );
      seriesRef.current!.attachPrimitive(primitive);
      selectionPrimitiveRef.current = primitive;
    }

  }, [aggregatedCandles, dividerTime]);

  // ghost base chart
  useEffect(() => {
    if (!baseChartSeriesRef.current || !chartApiRef.current) return;

    // align to outcome open
    const seriesData = [];
    const lastIndex = aggregatedSetupCandles.length - 1;
    const setupClose = aggregatedSetupCandles[lastIndex].close;
    const baseChartClose =  aggregatedBaseChart[aggregatedBaseChart.length - 1].close;
    const baseToSetupOffset = setupClose - baseChartClose;
    for (let i = 0; i < aggregatedBaseChart.length; i++) {
      const baseCandle = aggregatedBaseChart[i];
      const setupCandle = aggregatedSetupCandles[aggregatedSetupCandles.length - aggregatedBaseChart.length + i];
      seriesData.push({
        time: Math.floor(new Date(setupCandle.ctm).getTime() / 1000),
        open: baseCandle.open + baseToSetupOffset,
        high: baseCandle.high + baseToSetupOffset,
        low: baseCandle.low + baseToSetupOffset,
        close: baseCandle.close + baseToSetupOffset,
      })
    }
    setBaseGhostChart(seriesData);
    if (showBaseChart) {
      baseChartSeriesRef.current.setData(seriesData);
    }
  }, [aggregatedSetupCandles, aggregatedBaseChart]);

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

const normalize = (price: number, min: number, max: number) => {
    return (price - min) / (max - min) + 100;
  }


useEffect(() => {
  const chart = chartApiRef.current;
  const series = seriesRef.current;
  if (!chart || !series) return;


  if (transactionPrimitiveRef.current) {
    series.detachPrimitive(transactionPrimitiveRef.current);
    transactionPrimitiveRef.current = null;
  }

  if (transactionParams && outcomeCandles.length > 0) {
    // convert from relative values to absolute for detail transaction view
    const openPrice = outcomeCandles[0].open;

    const setupMin = Math.min(...setupCandles.map(candle => candle.low));
    const setupMax = Math.max(...setupCandles.map(candle => candle.high));

    const lastIndex = setupCandles.length - 1;
    const setupOffset = 100 - normalize(setupCandles[lastIndex].close, setupMin, setupMax);

    // calculate profit size (revert normalization)
    const normalizedProfitPrice = transactionParams.entryPrice + transactionParams.profitSize;
    const offsetProfitPrice = normalizedProfitPrice - setupOffset;
    const denormalizedProfitPrice = (offsetProfitPrice - 100) * (setupMax - setupMin) + setupMin;
    const profitSize = denormalizedProfitPrice - openPrice;

    // calculate loss size (revert normalization)
    const normalizedLossPrice = transactionParams.entryPrice + transactionParams.lossSize;
    const offsetLossPrice = normalizedLossPrice - setupOffset;
    const denormalizedLossPrice = (offsetLossPrice - 100) * (setupMax - setupMin) + setupMin;
    const lossSize = denormalizedLossPrice - openPrice;

    // Convert overlay index-based times to detail chart UTC timestamps
    // The transaction box duration in candles (from overlay chart indices)
    const durationInCandles = Math.max(1, (transactionParams.endTime as number) - (transactionParams.startTime as number));
    // Calculate the actual time duration based on the timeframe
    // Each candle represents timeframeMinutes minutes
    const timeframeMinutes = timeframe === "1m" ? 1 : parseInt(timeframe);
    const durationInSeconds = (Math.floor(durationInCandles / timeframeMinutes) + 1) * timeframeMinutes * 60;
    
    // Add the duration to the divider time (when outcome phase starts)
    const endTimeDetail = (dividerTime + durationInSeconds) as Time;

    const detailTransaction: TransactionBoxModel = {
      entryPrice: openPrice,
      profitSize: profitSize,
      lossSize: lossSize,
      startTime: dividerTime, // Use the divider time (last setup candle)
      endTime: endTimeDetail,
      position: transactionParams.position,
    }
    const primitive = new TransactionBoxPrimitive(chart, series, detailTransaction);
    transactionPrimitiveRef.current = primitive;
    series.attachPrimitive(primitive);

    chart.applyOptions(chart.options()); // force first draw
  }
}, [transactionParams, setupCandles, outcomeCandles, dividerTime, timeframe])


  return (
    <div className="flex flex-col h-full">
     <div className="relative flex-1">
            <div
              ref={chartRef}
              className="absolute inset-0"
            />
            <h4 className="text-lg absolute  top-3 left-72 z-10 font-semibold text-foreground">Setup + Outcome Chart</h4>
            

            <TimeframeButton value={timeframe} onChange={setTimeframe} />
            <Button
              variant="outline" 
              className="absolute top-2 right-32 z-10">
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
            </Button>
            <IndicatorsLayer
              chartApi={chartApi}
              candles={aggregatedSetupCandles}
              activeIndicators={activeIndicators}
              onAdd={addIndicator}
              onRemove={removeIndicator}
              onUpdateParams={updateParams}
            />
          </div>
    </div>
  );
};