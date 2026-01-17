import { useEffect, useRef, useState } from "react";
import { DrawMode, MAX_CANDLES, Volatility } from "@/pages/Chart";
import { toast } from "sonner";
import { CandleData } from "./MockChartDisplay";
import { createChart, CrosshairMode, CandlestickSeries, IChartApi, ISeriesApi, CandlestickData, ISeriesPrimitive, IPrimitivePaneView, Time, Logical, LineSeries } from "lightweight-charts";

interface ChartCanvasProps {
  drawMode: DrawMode;
  volatility: Volatility;
  onCandleCountChange?: (count: number) => void;
  onClear?: (clearFn: () => void) => void;
  setSearchInputCandles: (candles: CandleData[]) => void
}

export const ChartCanvas = ({drawMode, volatility, onCandleCountChange, onClear, setSearchInputCandles }: ChartCanvasProps) => {
  const [candles, setCandles] = useState<CandleData[]>([]);
  const chartRef = useRef<HTMLDivElement | null>(null);
  const chartApiRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const helperSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const clickHandlerRef = useRef<((param: any) => void) | null>(null);
  const crosshairHandlerRef = useRef<((param: any) => void) | null>(null);
  const drawingCandleRef = useRef<CandleData | null>(null);
  const rafPendingRef = useRef(false);

  const timestamp = useRef<number>(1);

  const volatilityMultiplier = {
    low: 0.25,
    medium: 0.5,
    high: 1.0,
  };

  useEffect(() => {
    if (!onClear) return;
    const clearHandler = () => {
      setCandles([]);
      seriesRef.current.setData([]);
      toast.success("Chart cleared");
    } 
    onClear(clearHandler);

  }, [onClear]);

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
      barSpacing: 30,
      visible: false,

      // rightBarStaysOnScroll: false,
      shiftVisibleRangeOnNewBar: false,
      // fixLeftEdge: true,
      // fixRightEdge: true,
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

  const PRICE_RANGE = { from: 99, to: 101 };

  chart.priceScale("right").setVisibleRange(PRICE_RANGE);
  chart.timeScale().setVisibleLogicalRange({
    from: 0,
    to: MAX_CANDLES,
  });

  // helper series to adjust price scale
  const helperSeries = chart.addSeries(LineSeries, {
    color: 'rgba(0,0,0,0)',   // invisible but still contributes
    lastValueVisible: false,
    priceLineVisible: false,
  });

  helperSeries.setData([
    { time: 0 as Time, value: 99 },
    { time: 1 as Time, value: 101 },
  ]);
  helperSeriesRef.current = helperSeries;

  const series = chart.addSeries(CandlestickSeries);

  chartApiRef.current = chart;
  seriesRef.current = series;


  return () => chart.remove();
}, []);


  const updateVisibleRange = () => {
    const count = candles.length + (drawingCandleRef.current ? 1 : 0);
    const chart = chartApiRef.current;
    chart.timeScale().setVisibleLogicalRange({
      from: 0,
      // to: Math.max(MAX_CANDLES, count),
      to: MAX_CANDLES
    });
  };



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
  const helperSeries = helperSeriesRef.current;

  if (!chart || !helperSeries) return;

  if (drawMode == "candle") {
    const handleClick = (param: any) => {
          
        if (!param.point || param.point.y === undefined) return;

        const price = helperSeries.coordinateToPrice(param.point.y);
        if (price == null) return;

        if (!drawingCandleRef.current) {
          const candle: CandleData = {
            open: price,
            close: price,
            high: price,
            low: price,
            ctm: timestamp.current++,
          };

          drawingCandleRef.current = candle;

          // preview immediately
          seriesRef.current?.update({
            time: candle.ctm as Time,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
          });
          // updateVisibleRange();

        } else {
          setCandles(prev => [...prev, drawingCandleRef.current!]);
          const candle: CandleData = {
            open: price,
            close: price,
            high: price,
            low: price,
            ctm: timestamp.current++,
          };
          drawingCandleRef.current = candle;
          seriesRef.current?.update({
            time: candle.ctm as Time,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
          });
          // updateVisibleRange();
        }
      };

      const handleMove = (param: any) => {
        const candle = drawingCandleRef.current;
        const series = seriesRef.current;
        const helperSeries = helperSeriesRef.current;

        if (
          !param.point ||
          param.point.y === undefined ||
          !candle ||
          !series ||
          !helperSeries
        ) {
          return;
        }

        if (rafPendingRef.current) return;

        const price = helperSeries.coordinateToPrice(param.point.y);
        if (price == null) return;

        rafPendingRef.current = true;

        requestAnimationFrame(() => {
          candle.close = price;
          const candleHeight = Math.abs(candle.close - candle.open);
          const wickUpHeight = candleHeight * Math.random() * volatilityMultiplier[volatility];
          const wickDownHeight = candleHeight * Math.random() * volatilityMultiplier[volatility];

          candle.high = Math.max(candle.open, candle.close) + wickUpHeight;
          candle.low = Math.min(candle.open, candle.close) - wickDownHeight;

          series.update({
            time: candle.ctm as Time,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
          });
          // updateVisibleRange();

          rafPendingRef.current = false;
          });
        };
    

        chart.subscribeClick(handleClick);
        chart.subscribeCrosshairMove(handleMove);

        return () => {
          chart.unsubscribeClick(handleClick);
          chart.unsubscribeCrosshairMove(handleMove);
        };
      } else {
        drawingCandleRef.current = null;
        seriesRef.current.pop(1);
        cleanupSelectionListeners();
      }
  }, [drawMode]);


useEffect(() => {
  onCandleCountChange(candles.length);
  setSearchInputCandles(candles);
}, [candles.length]);



const cleanupSelectionListeners = () => {
  const chart = chartApiRef.current;
  if (!chart) return;

  if (clickHandlerRef.current) {
    chart.unsubscribeClick(clickHandlerRef.current);
    clickHandlerRef.current = null;
  }

  if (crosshairHandlerRef.current) {
    chart.unsubscribeCrosshairMove(crosshairHandlerRef.current);
    crosshairHandlerRef.current = null;
  }
};

  return (
    <div className="w-full h-full rounded-lg border border-border overflow-hidden shadow-card bg-chart-bg relative">
      <div
           ref={chartRef}
           className="w-full h-full"
         />
    </div>
  );
};
