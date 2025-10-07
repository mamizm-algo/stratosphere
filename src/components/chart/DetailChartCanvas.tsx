import { useEffect, useRef } from "react";
import { Canvas as FabricCanvas, Line, Rect } from "fabric";
import { CandleData } from "./MockChartDisplay";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface DetailChartCanvasProps {
  setupCandles: CandleData[];
  outcomeCandles: CandleData[];
  chartType: "candle" | "line";
  onChartTypeChange?: (type: "candle" | "line") => void;
}

export const DetailChartCanvas = ({
  setupCandles,
  outcomeCandles,
  chartType,
  onChartTypeChange,
}: DetailChartCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);

  const CANVAS_WIDTH = 1200;
  const CANVAS_HEIGHT = 500;
  const PADDING = 40;
  const DIVIDER_X = CANVAS_WIDTH * 0.6; // Setup takes 60%, outcome takes 40%

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
  }, [setupCandles, outcomeCandles, chartType]);

  const drawChart = (canvas: FabricCanvas) => {
    // Calculate price range for all data
    const allCandles = [...setupCandles, ...outcomeCandles];
    const allPrices = allCandles.flatMap((c) => [c.high, c.low]);
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const priceRange = maxPrice - minPrice;
    const priceToY = (price: number) =>
      PADDING + ((maxPrice - price) / priceRange) * (CANVAS_HEIGHT - 2 * PADDING);

    // Draw grid
    drawGrid(canvas, minPrice, maxPrice, priceToY);

    // Draw setup candles
    const setupCandleWidth = (DIVIDER_X - 2 * PADDING) / setupCandles.length;
    setupCandles.forEach((candle, i) => {
      const x = PADDING + i * setupCandleWidth + setupCandleWidth / 2;
      drawCandle(canvas, candle, x, setupCandleWidth * 0.7, priceToY);
    });

    // Draw vertical divider
    const divider = new Line([DIVIDER_X, 0, DIVIDER_X, CANVAS_HEIGHT], {
      stroke: "hsl(180, 100%, 50%)",
      strokeWidth: 2,
      strokeDashArray: [10, 5],
      selectable: false,
      evented: false,
    });
    canvas.add(divider);

    // Draw outcome candles
    const outcomeCandleWidth = (CANVAS_WIDTH - DIVIDER_X - PADDING) / outcomeCandles.length;
    outcomeCandles.forEach((candle, i) => {
      const x = DIVIDER_X + i * outcomeCandleWidth + outcomeCandleWidth / 2;
      drawCandle(canvas, candle, x, outcomeCandleWidth * 0.7, priceToY);
    });

    canvas.renderAll();
  };

  const drawGrid = (
    canvas: FabricCanvas,
    minPrice: number,
    maxPrice: number,
    priceToY: (price: number) => number
  ) => {
    // Horizontal price lines
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
    }

    // Vertical time lines
    for (let x = PADDING; x < CANVAS_WIDTH - PADDING; x += 100) {
      const line = new Line([x, PADDING, x, CANVAS_HEIGHT - PADDING], {
        stroke: "hsl(220, 20%, 15%)",
        strokeWidth: 1,
        selectable: false,
        evented: false,
      });
      canvas.add(line);
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
      // Wick
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

      // Body
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
      // Line chart - connect close prices
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
      <div className="rounded-lg border border-border overflow-hidden shadow-card bg-chart-bg">
        <canvas ref={canvasRef} className="w-full" />
      </div>
    </div>
  );
};