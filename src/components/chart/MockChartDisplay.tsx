import { useEffect, useRef } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface CandleData {
  open: number;
  close: number;
  high: number;
  low: number;
  ctm: number;
  vol?: number;
}

interface MockChartDisplayProps {
  candles: CandleData[];
  width?: number;
  height?: number;
  showControls?: boolean;
  chartType?: "candle" | "line";
  onChartTypeChange?: (type: "candle" | "line") => void;
  opacity?: number;
}

export const MockChartDisplay = ({
  candles,
  width = 400,
  height = 200,
  showControls = false,
  chartType = "candle",
  onChartTypeChange,
  opacity = 1,
}: MockChartDisplayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate scales
    const allPrices = candles.flatMap((c) => [c.high, c.low]);
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const priceRange = maxPrice - minPrice;
    const padding = height/5;

    const candleWidth = (width - padding * 2) / candles.length;

    const priceToY = (price: number) => {
      return height - padding - ((price - minPrice) / priceRange) * (height - padding * 2);
    };

    if (chartType === "candle") {
      // Draw candlesticks
      candles.forEach((candle, index) => {
        const x = padding + index * candleWidth + candleWidth / 2;
        const isBullish = candle.close > candle.open;

        ctx.globalAlpha = opacity;

        // Draw wick
        ctx.strokeStyle = isBullish ? "hsl(142, 71%, 45%)" : "hsl(0, 84%, 60%)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, priceToY(candle.high));
        ctx.lineTo(x, priceToY(candle.low));
        ctx.stroke();

        // Draw body
        const bodyTop = Math.min(priceToY(candle.open), priceToY(candle.close));
        const bodyBottom = Math.max(priceToY(candle.open), priceToY(candle.close));
        const bodyHeight = Math.max(bodyBottom - bodyTop, 1);

        ctx.fillStyle = isBullish ? "hsl(142, 71%, 45%)" : "hsl(0, 84%, 60%)";
        ctx.fillRect(x - candleWidth / 4, bodyTop, candleWidth / 2, bodyHeight);

        ctx.globalAlpha = 1;
      });
    } else {
      // Draw line chart
      ctx.globalAlpha = opacity;
      ctx.strokeStyle = "hsl(30, 98%, 52%)";
      ctx.lineWidth = 2;
      ctx.beginPath();

      candles.forEach((candle, index) => {
        const x = padding + index * candleWidth + candleWidth / 2;
        const y = priceToY(candle.close);

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }, [candles, width, height, chartType, opacity]);

  return (
    <div className="flex flex-col gap-2">
      {showControls && (
        <div className="flex justify-end">
          <Select value={chartType} onValueChange={(v) => onChartTypeChange?.(v as "candle" | "line")}>
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
      <div className="rounded-md bg-chart-bg border border-chart-grid overflow-hidden">
        <canvas ref={canvasRef} width={width} height={height} className="w-full h-full" />
      </div>
    </div>
  );
};

// Generate mock candle data
export const generateMockCandles = (count: number, basePrice: number = 100, trend: "up" | "down" | "sideways" = "sideways"): CandleData[] => {
  const candles: CandleData[] = [];
  let currentPrice = basePrice;
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const volatility = 0.02;
    let change = (Math.random() - 0.5) * currentPrice * volatility;

    if (trend === "up") change += currentPrice * 0.005;
    if (trend === "down") change -= currentPrice * 0.005;

    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);

    candles.push({
      open,
      close,
      high,
      low,
      ctm: now - (count - i) * 3600000, // 1 hour per candle
    });

    currentPrice = close;
  }

  return candles;
};
