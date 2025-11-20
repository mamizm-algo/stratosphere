import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Line, Rect, Group, FabricObject } from "fabric";
import { CandleData } from "./MockChartDisplay";
import { Button } from "../ui/button";
import { Pencil, Trash2 } from "lucide-react";

interface OverlayChartCanvasProps {
  setupCandles: CandleData[];
  outcomesData: CandleData[][];
  chartType: "candle" | "line";
  onTransactionBoxChange?: (params: {
    takeProfit: number;
    stopLoss: number;
    timeHorizon: number;
    position: "long" | "short";
  } | null) => void;
  onEditTransaction?: () => void;
  initialTransactionBox?: {
    takeProfit: number;
    stopLoss: number;
    timeHorizon: number;
    position: "long" | "short";
  } | null;
}

export const OverlayChartCanvas = ({
  setupCandles,
  outcomesData,
  chartType,
  onTransactionBoxChange,
  onEditTransaction,
  initialTransactionBox,
}: OverlayChartCanvasProps) => {
  const CANVAS_WIDTH = 1283;
  const CANVAS_HEIGHT = 500;
  const PADDING = 40;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const [isDrawingBox, setIsDrawingBox] = useState(false);
  const [transactionBox, setTransactionBox] = useState<Group | null>(null);
  const [drawMode, setDrawMode] = useState<"select" | "draw">("select");
  const [drawStartY, setDrawStartY] = useState<number | null>(null);
  const [dividerX, setdividerX] = useState<number>(CANVAS_WIDTH * (setupCandles.length / (setupCandles.length + outcomesData[0]?.length || 1)));
  const isDrawingRef = useRef(false);


  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: "hsl(220, 25%, 8%)",
      selection: drawMode === "select",
    });

    fabricCanvasRef.current = canvas;
    drawChart(canvas);

    // Add initial transaction box if provided
    if (initialTransactionBox) {
      createTransactionBox(canvas, initialTransactionBox);
    }

    return () => {
      canvas.dispose();
    };
  }, [initialTransactionBox]);

  // Sync transaction box when initialTransactionBox changes
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !initialTransactionBox) return;

    // Only update if the box exists and params have changed
    if (transactionBox && initialTransactionBox) {
      const currentData = (transactionBox as any).transactionData;
      const hasChanged = 
        currentData.takeProfit !== initialTransactionBox.takeProfit ||
        currentData.stopLoss !== initialTransactionBox.stopLoss ||
        currentData.timeHorizon !== initialTransactionBox.timeHorizon ||
        currentData.position !== initialTransactionBox.position;

      if (hasChanged) {
        createTransactionBox(canvas, initialTransactionBox);
      }
    }
  }, [initialTransactionBox]);

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // Redraw chart when data or chart type changes
    canvas.clear();
    canvas.backgroundColor = "hsl(220, 25%, 8%)";
    drawChart(canvas);

    // Restore transaction box if it exists
    const existingParams = (transactionBox as any)?.transactionData || initialTransactionBox;
    if (existingParams) {
      createTransactionBox(canvas, existingParams);
    }
  }, [setupCandles, outcomesData, chartType]);

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.selection = drawMode === "select";
  }, [drawMode]);

  const drawChart = (canvas: FabricCanvas) => {
    // Calculate price range for all data
    const referenceSetupCandle = setupCandles[setupCandles.length-1];
    const allCandles = [...setupCandles.map(setupCandle => {return {
          x: setupCandle.x,
          open: setupCandle.open / referenceSetupCandle.close,
          close: setupCandle.close / referenceSetupCandle.close,
          high: setupCandle.high / referenceSetupCandle.close,
          low: setupCandle.low / referenceSetupCandle.close,
          ctm: setupCandle.ctm,
          vol: setupCandle.vol,
      }}), ...outcomesData.map(outcome => {  
            const referenceOutcomeCandle = outcome[0];
            return outcome.map((candle) => {
            return {
              x: candle.x,
              open: candle.open / referenceOutcomeCandle.open,
              close: candle.close / referenceOutcomeCandle.open,
              high: candle.high / referenceOutcomeCandle.open,
              low: candle.low / referenceOutcomeCandle.open,
              ctm: candle.ctm,
              vol: candle.vol,
          }
      })}).flat()];
    const allPrices = allCandles.flatMap((c) => [c.high, c.low]);
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const priceRange = maxPrice - minPrice;
    const priceToY = (price: number) =>
      PADDING + ((maxPrice - price) / priceRange) * (CANVAS_HEIGHT - 2 * PADDING);

    // Draw grid
    drawGrid(canvas, minPrice, maxPrice, priceToY);

    // Draw setup candles
    const setupCandleWidth = (CANVAS_WIDTH - 2 * PADDING) / (setupCandles.length + outcomesData[0]?.length || 1);
    setupCandles.forEach((candle, i) => {
      const x = PADDING + i * setupCandleWidth + setupCandleWidth / 2;
      const normalizedCandle = {
          x: candle.x,
          open: candle.open / referenceSetupCandle.close,
          close: candle.close / referenceSetupCandle.close,
          high: candle.high / referenceSetupCandle.close,
          low: candle.low / referenceSetupCandle.close,
          ctm: candle.ctm,
          vol: candle.vol,
      };
      drawCandle(canvas, normalizedCandle, x, setupCandleWidth * 0.7, priceToY, 1);
    });

    // Draw vertical divider
    const divider = new Line([dividerX, 0, dividerX, CANVAS_HEIGHT], {
      stroke: "hsl(180, 100%, 50%)",
      strokeWidth: 2,
      strokeDashArray: [10, 5],
      selectable: false,
      evented: false,
    });
    canvas.add(divider);

    // Draw outcome candles (overlaid with transparency)
    const outcomeCandleWidth = (CANVAS_WIDTH - PADDING) /  (setupCandles.length + outcomesData[0]?.length || 1);
    outcomesData.forEach((outcome) => {
      const referenceOutcomeCandle = outcome[0];
      outcome.forEach((candle, i) => {
        const x = dividerX + i * outcomeCandleWidth + outcomeCandleWidth / 2;
        const normalizedCandle = {
          x: candle.x,
          open: candle.open / referenceOutcomeCandle.open,
          close: candle.close / referenceOutcomeCandle.open,
          high: candle.high / referenceOutcomeCandle.open,
          low: candle.low / referenceOutcomeCandle.open,
          ctm: candle.ctm,
          vol: candle.vol,
      };
        drawCandle(canvas, normalizedCandle, x, outcomeCandleWidth * 0.7, priceToY, 0.3);
      });
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
    priceToY: (price: number) => number,
    opacity: number
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
          opacity,
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
        opacity,
      });
      canvas.add(body);
    } else {
      // Line chart
      if (opacity === 1) {
        // Only draw lines for setup (not outcomes)
        const closeY = priceToY(candle.close);
        const circle = new Rect({
          left: x - 2,
          top: closeY - 2,
          width: 4,
          height: 4,
          fill: color,
          selectable: false,
          evented: false,
          opacity,
        });
        canvas.add(circle);
      }
    }
  };

  const createTransactionBox = (
    canvas: FabricCanvas,
    params: {
      takeProfit: number;
      stopLoss: number;
      timeHorizon: number;
      position: "long" | "short";
    }
  ) => {
    // Remove existing transaction box
    if (transactionBox) {
      canvas.remove(transactionBox);
    }

    const allCandles = [...setupCandles, ...outcomesData.flat()];
    const allPrices = allCandles.flatMap((c) => [c.high, c.low]);
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const priceRange = maxPrice - minPrice;
    const priceToY = (price: number) =>
      PADDING + ((maxPrice - price) / priceRange) * (CANVAS_HEIGHT - 2 * PADDING);

    const transactionOpenPrice = outcomesData[0][0].open;
    const entryY = priceToY(transactionOpenPrice);
    const takeProfitY = priceToY(transactionOpenPrice * (1 + params.takeProfit / 100 * (params.position === "long" ? 1 : -1)));
    const stopLossY = priceToY(transactionOpenPrice * (1 - params.stopLoss / 100 * (params.position === "long" ? 1 : -1)));

    const boxWidth = (params.timeHorizon / setupCandles.length) * (dividerX - 2 * PADDING);
    const boxLeft = dividerX - 10;

    // Profit area (green)
    const profitHeight = Math.abs(takeProfitY - entryY);
    const profitArea = new Rect({
      left: boxLeft,
      top: params.position === "long" ? takeProfitY : entryY,
      width: boxWidth,
      height: profitHeight,
      fill: "rgba(34, 197, 94, 0.3)",
      stroke: "hsl(142, 76%, 36%)",
      strokeWidth: 2,
    });

    // Loss area (red)
    const lossHeight = Math.abs(stopLossY - entryY);
    const lossArea = new Rect({
      left: boxLeft,
      top: params.position === "long" ? entryY : stopLossY,
      width: boxWidth,
      height: lossHeight,
      fill: "rgba(239, 68, 68, 0.3)",
      stroke: "hsl(0, 72%, 51%)",
      strokeWidth: 2,
    });

    // Create group
    const group = new Group([profitArea, lossArea], {
      selectable: true,
      hasControls: true,
      lockRotation: true,
    });

    // Store transaction data
    (group as any).transactionData = params;
    (group as any).isTransactionBox = true;

    // Handle group moving
    group.on("modified", () => {
      updateTransactionFromBox(group, transactionOpenPrice);
    });

    canvas.add(group);
    setTransactionBox(group);
    canvas.renderAll();
  };

  const updateTransactionFromBox = (group: Group, entryY: number) => {
    const allCandles = [...setupCandles, ...outcomesData.flat()];
    const allPrices = allCandles.flatMap((c) => [c.high, c.low]);
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const priceRange = maxPrice - minPrice;
    const yToPrice = (y: number) =>
      Math.round(maxPrice - ((y - PADDING) / (CANVAS_HEIGHT - 2 * PADDING)) * priceRange);

    const bounds = group.getBoundingRect();
    const entryPrice = entryY; //yToPrice(bounds.top + bounds.height / 2);
    const topPrice = yToPrice(bounds.top);
    const bottomPrice = yToPrice(bounds.top + bounds.height);
    
    const originalData = (group as any).transactionData;
    const position = originalData.position;
    console.log(entryPrice);

    const takeProfit = Math.abs((topPrice - entryPrice) / entryPrice * 100);
    const stopLoss = Math.abs((entryPrice - bottomPrice) / entryPrice * 100);
    const timeHorizon = Math.round((bounds.width / (dividerX - 2 * PADDING)) * setupCandles.length);

    const updatedParams = {
      entry: entryPrice,
      takeProfit: position === "long" ? takeProfit : stopLoss,
      stopLoss: position === "long" ? stopLoss : takeProfit,
      timeHorizon,
      position,
    };

    (group as any).transactionData = updatedParams;
    onTransactionBoxChange?.(updatedParams);
  };

  const handleCanvasMouseDown = (e: any) => {
    if (drawMode !== "draw") return;

    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const pointer = canvas.getPointer(e.e);
    setDrawStartY(pointer.y);
    isDrawingRef.current = true;
  };

  const handleCanvasMouseUp = (e: any) => {
    if (drawMode !== "draw" || !isDrawingRef.current || drawStartY === null) return;

    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const pointer = canvas.getPointer(e.e);
    
    // Calculate price from Y position
    const allCandles = [...setupCandles, ...outcomesData.flat()];
    const allPrices = allCandles.flatMap((c) => [c.high, c.low]);
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const priceRange = maxPrice - minPrice;
    const yToPrice = (y: number) =>
      Math.round(maxPrice - ((y - PADDING) / (CANVAS_HEIGHT - 2 * PADDING)) * priceRange);
    
    const startPrice = yToPrice(drawStartY);
    const endPrice = yToPrice(pointer.y);
    const entryPrice = (startPrice + endPrice) / 2;
    
    // Determine position based on drag direction
    const draggedDown = pointer.y > drawStartY;
    const position: "long" | "short" = draggedDown ? "short" : "long";
    
    // Calculate take profit and stop loss based on drag distance
    const dragDistance = Math.abs(endPrice - startPrice);
    const takeProfitPercent = (dragDistance / entryPrice) * 100 * 0.66; // 2/3 of distance
    const stopLossPercent = (dragDistance / entryPrice) * 100 * 0.33; // 1/3 of distance
    
    const defaultParams = {
      entry: entryPrice,
      takeProfit: Math.max(0.5, takeProfitPercent),
      stopLoss: Math.max(0.5, stopLossPercent),
      timeHorizon: 10,
      position,
    };

    createTransactionBox(canvas, defaultParams);
    onTransactionBoxChange?.(defaultParams);
    setDrawMode("select");
    setIsDrawingBox(false);
    isDrawingRef.current = false;
    setDrawStartY(null);
  };

  const handleDeleteBox = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !transactionBox) return;

    canvas.remove(transactionBox);
    setTransactionBox(null);
    onTransactionBoxChange?.(null);
    canvas.renderAll();
  };

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.on("mouse:down", handleCanvasMouseDown);
    canvas.on("mouse:up", handleCanvasMouseUp);

    return () => {
      canvas.off("mouse:down", handleCanvasMouseDown);
      canvas.off("mouse:up", handleCanvasMouseUp);
    };
  }, [drawMode, setupCandles, outcomesData, drawStartY]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant={drawMode === "draw" ? "default" : "outline"}
          size="sm"
          onClick={() => setDrawMode(drawMode === "draw" ? "select" : "draw")}
          className="gap-2"
        >
          <Pencil className="w-4 h-4" />
          {drawMode === "draw" ? "Drag to Draw Box (↑=Long, ↓=Short)" : "Draw Transaction Box"}
        </Button>
        {transactionBox && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteBox}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Box
            </Button>
          </>
        )}
      </div>
      <div className="rounded-lg border border-border overflow-hidden shadow-card bg-chart-bg">
        <canvas ref={canvasRef} className="w-full" />
      </div>
    </div>
  );
};
