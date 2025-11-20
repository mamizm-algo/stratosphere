import { useEffect, useRef } from "react";
import { Canvas as FabricCanvas, Line, Rect, Text } from "fabric";
import { CandleData } from "./MockChartDisplay";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { format } from "date-fns";

interface BaseChartCanvasProps {
  candles: CandleData[];
  chartType: "candle" | "line";
  onChartTypeChange?: (type: "candle" | "line") => void;
}

export const BaseChartCanvas = ({
  candles,
  chartType,
  onChartTypeChange,
}: BaseChartCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);

  const CANVAS_WIDTH = 1334;
  const CANVAS_HEIGHT = 600;
  const PADDING = 60;

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: "hsl(220, 25%, 8%)",
      selection: false,
    });

    fabricCanvasRef.current = canvas;
    drawChart(canvas);

    return () => {
      canvas.dispose();
    };
  }, []);

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.clear();
    canvas.backgroundColor = "hsl(220, 25%, 8%)";
    drawChart(canvas);
  }, [candles, chartType]);

  const drawChart = (canvas: FabricCanvas) => {
    const allPrices = candles.flatMap((c) => [c.high, c.low]);
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const priceRange = maxPrice - minPrice;
    const priceToY = (price: number) =>
      PADDING + ((maxPrice - price) / priceRange) * (CANVAS_HEIGHT - 2 * PADDING);

    drawGrid(canvas, minPrice, maxPrice, priceToY);

    const candleWidth = (CANVAS_WIDTH - 2 * PADDING) / candles.length;
    candles.forEach((candle, i) => {
      const x = PADDING + i * candleWidth + candleWidth / 2;
      drawCandle(canvas, candle, x, candleWidth * 0.7, priceToY);
    });

    canvas.renderAll();
  };

  const drawGrid = (
    canvas: FabricCanvas,
    minPrice: number,
    maxPrice: number,
    priceToY: (price: number) => number
  ) => {
    const priceStep = (maxPrice - minPrice) / 5;
    for (let i = 0; i <= 5; i++) {
      const price = minPrice + i * priceStep;
      const y = priceToY(price);
      const line = new Line([PADDING, y, CANVAS_WIDTH - PADDING, y], {
        stroke: "hsl(220, 20%, 15%)",
        strokeWidth: 1,
        selectable: false,
        evented: false,
      });
      canvas.add(line);

      // Y-axis price labels
      const priceLabel = new Text(price.toFixed(2), {
        left: CANVAS_WIDTH - PADDING + 5,
        top: y - 8,
        fontSize: 12,
        fill: "hsl(215, 20%, 65%)",
        selectable: false,
        evented: false,
      });
      canvas.add(priceLabel);
    }

    // Vertical time lines and X-axis labels
    const timeStep = Math.floor(candles.length / 6);
    for (let i = 0; i <= 6; i++) {
      const candleIndex = Math.min(i * timeStep, candles.length - 1);
      const x = PADDING + candleIndex * ((CANVAS_WIDTH - 2 * PADDING) / candles.length) + ((CANVAS_WIDTH - 2 * PADDING) / candles.length) / 2;
      
      const line = new Line([x, PADDING, x, CANVAS_HEIGHT - PADDING], {
        stroke: "hsl(220, 20%, 15%)",
        strokeWidth: 1,
        selectable: false,
        evented: false,
      });
      canvas.add(line);

      // X-axis time labels
      const candle = candles[candleIndex];
      const timestamp = candle.ctm || new Date(Date.now() - (candles.length - candleIndex) * 3600000);
      const timeLabel = new Text(format(timestamp, "MM/dd HH:mm"), {
        left: x - 30,
        top: CANVAS_HEIGHT - PADDING + 5,
        fontSize: 11,
        fill: "hsl(215, 20%, 65%)",
        selectable: false,
        evented: false,
      });
      canvas.add(timeLabel);
    }
  };

  const drawCandle = (
    canvas: FabricCanvas,
    candle: CandleData,
    x: number,
    width: number,
    priceToY: (price: number) => number
  ) => {
    const isBullish = candle.close > candle.open;
    const color = isBullish ? "hsl(142, 76%, 36%)" : "hsl(0, 72%, 51%)";

    if (chartType === "candle") {
      const wick = new Line(
        [x, priceToY(candle.high), x, priceToY(candle.low)],
        {
          stroke: color,
          strokeWidth: 2,
          selectable: false,
          evented: false,
        }
      );
      canvas.add(wick);

      const bodyTop = Math.min(priceToY(candle.open), priceToY(candle.close));
      const bodyHeight = Math.abs(priceToY(candle.close) - priceToY(candle.open));
      const body = new Rect({
        left: x - width / 2,
        top: bodyTop,
        width,
        height: Math.max(bodyHeight, 1),
        fill: color,
        stroke: color,
        strokeWidth: 1,
        selectable: false,
        evented: false,
      });
      canvas.add(body);
    } else {
      const closeY = priceToY(candle.close);
      const circle = new Rect({
        left: x - 2,
        top: closeY - 2,
        width: 4,
        height: 4,
        fill: "hsl(217, 91%, 60%)",
        selectable: false,
        evented: false,
      });
      canvas.add(circle);
    }
  };

  return (
    <div className="space-y-4">
      {onChartTypeChange && (
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold text-foreground">Base Chart (Search Input)</h4>
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
      <div className="rounded-lg border border-border overflow-hidden shadow-card bg-chart-bg">
        <canvas ref={canvasRef} className="w-full" />
      </div>
    </div>
  );
};
