import { useState, useEffect, useRef, useCallback } from "react";
import { HomeHeader } from "@/components/HomeHeader";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";
import { CandleData } from "@/components/chart/MockChartDisplay";
import { calculateSimilarityScore } from "@/lib/similarityCalculator";
import { createChart, CandlestickSeries, IChartApi, ISeriesApi, CrosshairMode, Time } from "lightweight-charts";

const generateSandboxCandles = (count: number, seed?: number): CandleData[] => {
  const candles: CandleData[] = [];
  const basePrice = 100 + (seed ?? Math.random()) * 50;
  let currentPrice = basePrice;
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const volatility = 0.02 + Math.random() * 0.02;
    const change = (Math.random() - 0.5) * currentPrice * volatility;

    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) * (1 + Math.random() * 0.015);
    const low = Math.min(open, close) * (1 - Math.random() * 0.015);

    candles.push({
      open,
      close,
      high,
      low,
      ctm: now - (count - i) * 3600000,
    });

    currentPrice = close;
  }

  return candles;
};

interface SandboxChartProps {
  candles: CandleData[];
  onRegenerate: () => void;
  label: string;
}

const SandboxChart = ({ candles, onRegenerate, label }: SandboxChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
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
        timeVisible: true,
        secondsVisible: false,
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

  useEffect(() => {
    const chart = chartApiRef.current;
    if (!chart || !chartRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (chartRef.current) {
        chart.resize(chartRef.current.clientWidth, chartRef.current.clientHeight);
      }
    });

    resizeObserver.observe(chartRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!seriesRef.current || !chartApiRef.current) return;

    const seriesData = candles.map((c) => ({
      time: (new Date(c.ctm).getTime() / 1000) as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    seriesRef.current.setData(seriesData);
    chartApiRef.current.timeScale().fitContent();
  }, [candles]);

  return (
    <div className="flex flex-col gap-3 flex-1 min-w-0">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRegenerate}
          className="h-8 w-8 hover:bg-primary/10"
          title="Regenerate chart"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <div
        ref={chartRef}
        className="w-full h-[300px] md:h-[400px] rounded-lg border border-border overflow-hidden"
      />
    </div>
  );
};

const Sandbox = () => {
  const [candleCount, setCandleCount] = useState(20);
  const [chartA, setChartA] = useState<CandleData[]>([]);
  const [chartB, setChartB] = useState<CandleData[]>([]);
  const [similarity, setSimilarity] = useState<number>(0);

  const regenerateChartA = useCallback(() => {
    setChartA(generateSandboxCandles(candleCount));
  }, [candleCount]);

  const regenerateChartB = useCallback(() => {
    setChartB(generateSandboxCandles(candleCount));
  }, [candleCount]);

  // Initialize charts
  useEffect(() => {
    setChartA(generateSandboxCandles(candleCount));
    setChartB(generateSandboxCandles(candleCount));
  }, []);

  // Recalculate similarity when charts change
  useEffect(() => {
    if (chartA.length > 0 && chartB.length > 0) {
      const score = calculateSimilarityScore({
        referencePattern: chartA,
        candidatePattern: chartB,
      });
      setSimilarity(score);
    }
  }, [chartA, chartB]);

  // Handle candle count change
  const handleCandleCountChange = (value: number[]) => {
    const newCount = value[0];
    setCandleCount(newCount);
    setChartA(generateSandboxCandles(newCount));
    setChartB(generateSandboxCandles(newCount));
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <HomeHeader />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {/* Description */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Similarity Sandbox
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore how chart similarity works. Regenerate charts independently and adjust the candle count 
            to see how the similarity score changes in real-time.
          </p>
        </div>

        {/* Similarity Score */}
        <Card className="mx-auto mb-8 p-6 max-w-md bg-card/50 border-border">
          <div className="text-center">
            <span className="text-sm text-muted-foreground uppercase tracking-wider">
              Similarity Score
            </span>
            <div className="mt-2 text-5xl md:text-6xl font-bold text-primary">
              {similarity}%
            </div>
          </div>
        </Card>

        {/* Charts */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <SandboxChart
            candles={chartA}
            onRegenerate={regenerateChartA}
            label="Chart A"
          />
          <SandboxChart
            candles={chartB}
            onRegenerate={regenerateChartB}
            label="Chart B"
          />
        </div>

        {/* Candle Count Slider */}
        <Card className="mx-auto p-6 max-w-md bg-card/50 border-border">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Candle Count</span>
              <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                {candleCount}
              </span>
            </div>
            <Slider
              value={[candleCount]}
              onValueChange={handleCandleCountChange}
              min={2}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>2</span>
              <span>100</span>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Sandbox;
