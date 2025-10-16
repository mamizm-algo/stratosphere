import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Rect, Line, Group, FabricObject } from "fabric";
import { DrawMode, Volatility } from "@/pages/Chart";
import { toast } from "sonner";

interface Candle {
  id: string;
  open: number;
  close: number;
  high: number;
  low: number;
  x: number;
}

interface ChartCanvasProps {
  drawMode: DrawMode;
  volatility: Volatility;
  onCandleCountChange?: (count: number) => void;
  onClear?: (clearFn: () => void) => void;
}

export const ChartCanvas = ({ drawMode, volatility, onCandleCountChange, onClear }: ChartCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [openPrice, setOpenPrice] = useState<number | null>(null);
  const [previewLine, setPreviewLine] = useState<Line | null>(null);

  const volatilityMultiplier = {
    low: 0.25,
    medium: 0.5,
    high: 1.0,
  };

  // Initialize Fabric canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: canvasRef.current.offsetWidth,
      height: canvasRef.current.offsetHeight,
      backgroundColor: "hsl(220, 25%, 8%)",
      selection: drawMode === "select",
    });

    fabricCanvasRef.current = canvas;
    drawGrid(canvas);

    return () => {
      canvas.dispose();
    };
  }, []);

  // Update canvas interaction mode
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.selection = drawMode === "select";
    canvas.isDrawingMode = false;

    // Enable/disable object selection based on draw mode
    canvas.forEachObject((obj) => {
      obj.selectable = drawMode === "select";
      obj.evented = drawMode === "select";
    });

    canvas.renderAll();
  }, [drawMode]);

  const drawGrid = (canvas: FabricCanvas) => {
    const width = canvas.width || 800;
    const height = canvas.height || 600;

    // Vertical lines
    for (let x = 0; x < width; x += 50) {
      const line = new Line([x, 0, x, height], {
        stroke: "hsl(220, 20%, 15%)",
        strokeWidth: 1,
        selectable: false,
        evented: false,
      });
      canvas.add(line);
    }

    // Horizontal lines
    for (let y = 0; y < height; y += 50) {
      const line = new Line([0, y, width, y], {
        stroke: "hsl(220, 20%, 15%)",
        strokeWidth: 1,
        selectable: false,
        evented: false,
      });
      canvas.add(line);
    }
  };

  const createCandleGroup = (candle: Candle): Group => {
    const candleWidth = 30;
    const isBullish = candle.close < candle.open; // Note: inverted because canvas Y is top-down
    const color = isBullish ? "hsl(142, 76%, 36%)" : "hsl(0, 72%, 51%)";

    // Wick line
    const wick = new Line([candle.x, candle.high, candle.x, candle.low], {
      stroke: color,
      strokeWidth: 2,
    });

    // Body rectangle
    const bodyHeight = Math.abs(candle.close - candle.open);
    const bodyTop = Math.min(candle.open, candle.close);
    const body = new Rect({
      left: candle.x - candleWidth / 2,
      top: bodyTop,
      width: candleWidth,
      height: Math.max(bodyHeight, 1),
      fill: color,
      stroke: color,
      strokeWidth: 1,
    });

    // Create group
    const group = new Group([wick, body], {
      selectable: true,
      hasControls: false,
      lockRotation: true,
      lockScalingX: true,
      lockScalingY: true,
      lockMovementY: true, // Prevent vertical floating
    });

    // Store candle data
    (group as any).candleData = candle;

    // Handle horizontal dragging on the group (order change only)
    group.on("moving", (e) => {
      const obj = e.transform?.target as Group;
      const candleData = (obj as any).candleData as Candle;
      
      // Update only X position (horizontal movement for order change)
      candleData.x = obj.left || candle.x;
    });

    // Add individual wick control points
    const topWickControl = new Rect({
      left: candle.x - 5,
      top: candle.high - 5,
      width: 10,
      height: 10,
      fill: "hsl(217, 91%, 60%)",
      opacity: 0,
      hasControls: false,
      lockRotation: true,
    });

    const bottomWickControl = new Rect({
      left: candle.x - 5,
      top: candle.low - 5,
      width: 10,
      height: 10,
      fill: "hsl(217, 91%, 60%)",
      opacity: 0,
      hasControls: false,
      lockRotation: true,
    });

    (topWickControl as any).wickType = "high";
    (topWickControl as any).candleId = candle.id;
    (bottomWickControl as any).wickType = "low";
    (bottomWickControl as any).candleId = candle.id;

    topWickControl.on("mouseover", () => {
      topWickControl.set({ opacity: 0.7 });
      fabricCanvasRef.current?.renderAll();
    });

    topWickControl.on("mouseout", () => {
      topWickControl.set({ opacity: 0 });
      fabricCanvasRef.current?.renderAll();
    });

    bottomWickControl.on("mouseover", () => {
      bottomWickControl.set({ opacity: 0.7 });
      fabricCanvasRef.current?.renderAll();
    });

    bottomWickControl.on("mouseout", () => {
      bottomWickControl.set({ opacity: 0 });
      fabricCanvasRef.current?.renderAll();
    });

    topWickControl.on("moving", (e) => {
      const obj = e.transform?.target as Rect;
      const candleId = (obj as any).candleId;
      
      setCandles((prev) =>
        prev.map((c) => {
          if (c.id === candleId) {
            const newHigh = obj.top! + 5;
            return { ...c, high: Math.min(newHigh, Math.min(c.open, c.close)) };
          }
          return c;
        })
      );
    });

    bottomWickControl.on("moving", (e) => {
      const obj = e.transform?.target as Rect;
      const candleId = (obj as any).candleId;
      
      setCandles((prev) =>
        prev.map((c) => {
          if (c.id === candleId) {
            const newLow = obj.top! + 5;
            return { ...c, low: Math.max(newLow, Math.max(c.open, c.close)) };
          }
          return c;
        })
      );
    });

    return group;
  };

  // Redraw candles when they change
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // Remove old candle groups
    const objectsToRemove: FabricObject[] = [];
    canvas.forEachObject((obj) => {
      if ((obj as any).candleData) {
        objectsToRemove.push(obj);
      }
    });
    objectsToRemove.forEach((obj) => canvas.remove(obj));

    // Add new candle groups
    candles.forEach((candle) => {
      const group = createCandleGroup(candle);
      canvas.add(group);
    });

    canvas.renderAll();
  }, [candles]);

  const handleCanvasClick = (e: any) => {
    if (drawMode !== "candle") return;

    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const pointer = canvas.getPointer(e.e);
    const y = pointer.y;

    if (!isDrawing) {
      // First click - set OPEN price
      setOpenPrice(y);
      setIsDrawing(true);

      // Show preview line
      const line = new Line([0, y, canvas.width || 800, y], {
        stroke: "hsl(217, 91%, 60%)",
        strokeWidth: 1,
        strokeDashArray: [5, 5],
        selectable: false,
        evented: false,
      });
      canvas.add(line);
      setPreviewLine(line);

      toast.info("Click again to set CLOSING price");
    } else {
      // Second click - set CLOSE price and create candle
      const open = openPrice!;
      const close = y;
      const x = 50 + candles.length * 50;

      const candleHeight = Math.abs(close - open);
      const wickHeight = candleHeight * volatilityMultiplier[volatility];

      const newCandle: Candle = {
        id: `candle-${Date.now()}`,
        x,
        open,
        close,
        high: Math.min(open, close) - wickHeight,
        low: Math.max(open, close) + wickHeight,
      };

      const updatedCandles = [...candles, newCandle];
      setCandles(updatedCandles);
      setIsDrawing(false);
      setOpenPrice(close); // Next candle opens at this closing price
      
      // Notify parent of candle count change
      onCandleCountChange?.(updatedCandles.length);

      // Remove preview line
      if (previewLine) {
        canvas.remove(previewLine);
        setPreviewLine(null);
      }

      toast.success("Candle created! Drag wicks to adjust.");
    }
  };

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.on("mouse:down", handleCanvasClick);

    return () => {
      canvas.off("mouse:down", handleCanvasClick);
    };
  }, [drawMode, isDrawing, openPrice, candles, volatility]);

  // Clear functionality - pass clear handler to parent
  useEffect(() => {
    if (!onClear) return;
    
    const clearHandler = () => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;
      
      // Clear all candles
      setCandles([]);
      setIsDrawing(false);
      setOpenPrice(null);
      
      // Remove preview line if exists
      if (previewLine) {
        canvas.remove(previewLine);
        setPreviewLine(null);
      }
      
      // Notify parent
      onCandleCountChange?.(0);
      
      toast.success("Chart cleared");
    };
    
    // Pass clear handler to parent
    onClear(clearHandler);
  }, [onClear, previewLine, onCandleCountChange]);

  return (
    <div className="w-full h-full rounded-lg border border-border overflow-hidden shadow-card bg-chart-bg relative">
      <canvas ref={canvasRef} className="w-full h-full" style={{ cursor: drawMode === "candle" ? "crosshair" : "default" }} />
      {candles.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground text-lg">First click sets OPEN, second click sets CLOSE</p>
            <p className="text-muted-foreground/60 text-sm">Draw at least 2 candles to search similar patterns</p>
          </div>
        </div>
      )}
    </div>
  );
};
