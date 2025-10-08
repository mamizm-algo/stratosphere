import { useEffect, useRef } from "react";
import { Canvas as FabricCanvas, Line, Rect, Group, Text } from "fabric";
import { CandleData } from "./MockChartDisplay";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { format } from "date-fns";

interface DetailChartCanvasProps {
  setupCandles: CandleData[];
  outcomeCandles: CandleData[];
  chartType: "candle" | "line";
  onChartTypeChange?: (type: "candle" | "line") => void;
  transactionParams?: {
    entry: number;
    takeProfit: number;
    stopLoss: number;
    timeHorizon: number;
    position: "long" | "short";
  } | null;
}

export const DetailChartCanvas = ({
  setupCandles,
  outcomeCandles,
  chartType,
  onChartTypeChange,
  transactionParams,
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
  }, [setupCandles, outcomeCandles, chartType, transactionParams]);

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

    // Draw transaction box if parameters are provided
    if (transactionParams) {
      drawTransactionBox(canvas, priceToY);
    }

    canvas.renderAll();
  };

  const drawTransactionBox = (canvas: FabricCanvas, priceToY: (price: number) => number) => {
    if (!transactionParams) return;

    const entryY = priceToY(transactionParams.entry);
    const takeProfitY = priceToY(transactionParams.entry * (1 + transactionParams.takeProfit / 100 * (transactionParams.position === "long" ? 1 : -1)));
    const stopLossY = priceToY(transactionParams.entry * (1 - transactionParams.stopLoss / 100 * (transactionParams.position === "long" ? 1 : -1)));

    const boxWidth = (transactionParams.timeHorizon / setupCandles.length) * (DIVIDER_X - 2 * PADDING);
    const boxLeft = DIVIDER_X - 10;

    // Profit area (green)
    const profitHeight = Math.abs(takeProfitY - entryY);
    const profitArea = new Rect({
      left: boxLeft,
      top: transactionParams.position === "long" ? takeProfitY : entryY,
      width: boxWidth,
      height: profitHeight,
      fill: "rgba(34, 197, 94, 0.3)",
      stroke: "hsl(142, 76%, 36%)",
      strokeWidth: 2,
      selectable: false,
      evented: false,
    });

    // Loss area (red)
    const lossHeight = Math.abs(stopLossY - entryY);
    const lossArea = new Rect({
      left: boxLeft,
      top: transactionParams.position === "long" ? entryY : stopLossY,
      width: boxWidth,
      height: lossHeight,
      fill: "rgba(239, 68, 68, 0.3)",
      stroke: "hsl(0, 72%, 51%)",
      strokeWidth: 2,
      selectable: false,
      evented: false,
    });

    // Entry line
    const entryLine = new Line([boxLeft, entryY, boxLeft + boxWidth, entryY], {
      stroke: "hsl(217, 91%, 60%)",
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      selectable: false,
      evented: false,
    });

    canvas.add(profitArea, lossArea, entryLine);
  };

  const drawGrid = (
    canvas: FabricCanvas,
    minPrice: number,
    maxPrice: number,
    priceToY: (price: number) => number
  ) => {
    // Horizontal price lines with Y-axis labels
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

    // Vertical time lines with X-axis labels
    const allCandles = [...setupCandles, ...outcomeCandles];
    const timeStep = Math.floor(allCandles.length / 6);
    for (let i = 0; i <= 6; i++) {
      const candleIndex = Math.min(i * timeStep, allCandles.length - 1);
      const isInSetup = candleIndex < setupCandles.length;
      
      let x: number;
      if (isInSetup) {
        const setupWidth = DIVIDER_X - 2 * PADDING;
        x = PADDING + (candleIndex / setupCandles.length) * setupWidth + (setupWidth / setupCandles.length) / 2;
      } else {
        const outcomeIndex = candleIndex - setupCandles.length;
        const outcomeWidth = CANVAS_WIDTH - DIVIDER_X - PADDING;
        x = DIVIDER_X + (outcomeIndex / outcomeCandles.length) * outcomeWidth + (outcomeWidth / outcomeCandles.length) / 2;
      }
      
      const line = new Line([x, PADDING, x, CANVAS_HEIGHT - PADDING], {
        stroke: "hsl(220, 20%, 15%)",
        strokeWidth: 1,
        selectable: false,
        evented: false,
      });
      canvas.add(line);

      // X-axis time labels
      const candle = allCandles[candleIndex];
      const timestamp = candle.timestamp || new Date(Date.now() - (allCandles.length - candleIndex) * 3600000);
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