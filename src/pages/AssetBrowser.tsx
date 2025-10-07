import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Canvas as FabricCanvas, Line, Rect } from "fabric";
import { ArrowLeft, Search as SearchIcon, FolderPlus } from "lucide-react";
import { ChartHeader } from "@/components/chart/ChartHeader";
import { SimilaritySearchDialog, SearchConfig } from "@/components/chart/SimilaritySearchDialog";
import { SimilarityResults, SimilarPattern } from "@/components/chart/SimilarityResults";
import { CandleData, generateMockCandles } from "@/components/chart/MockChartDisplay";
import { AddToCollectionDialog } from "@/components/library/AddToCollectionDialog";
import { useCollections } from "@/hooks/useCollections";
import { toast } from "sonner";

type Timeframe = "1m" | "5m" | "15m" | "1h" | "4h" | "1d";

const AssetBrowser = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  
  const [asset, setAsset] = useState("BTC/USD");
  const [timeframe, setTimeframe] = useState<Timeframe>("1h");
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(null);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<SimilarPattern[]>([]);
  const [addToCollectionOpen, setAddToCollectionOpen] = useState(false);
  const [currentFragmentData, setCurrentFragmentData] = useState<CandleData[]>([]);

  const { collections, addResultToCollection } = useCollections();

  const CHART_WIDTH = 1200;
  const CHART_HEIGHT = 600;
  const PADDING = 60;

  // Generate mock candles for the selected asset
  useEffect(() => {
    const mockCandles = generateMockCandles(100, 50000, "sideways");
    setCandles(mockCandles);
  }, [asset, timeframe]);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || fabricCanvas) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: CHART_WIDTH,
      height: CHART_HEIGHT,
      backgroundColor: "hsl(240 10% 3.9%)",
      selection: false,
    });

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, []);

  // Draw candles on canvas
  useEffect(() => {
    if (!fabricCanvas || candles.length === 0) return;

    // Clear existing objects except selection overlays
    const objects = fabricCanvas.getObjects();
    objects.forEach((obj) => {
      if (!(obj as any).isSelection) {
        fabricCanvas.remove(obj);
      }
    });

    // Calculate scales
    const allPrices = candles.flatMap((c) => [c.high, c.low]);
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const priceRange = maxPrice - minPrice;

    const candleWidth = (CHART_WIDTH - PADDING * 2) / candles.length;

    const priceToY = (price: number) => {
      return CHART_HEIGHT - PADDING - ((price - minPrice) / priceRange) * (CHART_HEIGHT - PADDING * 2);
    };

    const indexToX = (index: number) => {
      return PADDING + index * candleWidth + candleWidth / 2;
    };

    // Draw grid
    const gridLines: Line[] = [];
    for (let i = 0; i <= 10; i++) {
      const y = PADDING + (i * (CHART_HEIGHT - PADDING * 2)) / 10;
      const line = new Line([PADDING, y, CHART_WIDTH - PADDING, y], {
        stroke: "hsl(240 3.7% 15.9%)",
        strokeWidth: 1,
        selectable: false,
        evented: false,
      });
      gridLines.push(line);
    }
    fabricCanvas.add(...gridLines);

    // Draw candlesticks
    candles.forEach((candle, index) => {
      const x = indexToX(index);
      const isBullish = candle.close > candle.open;

      // Wick
      const wick = new Line([x, priceToY(candle.high), x, priceToY(candle.low)], {
        stroke: isBullish ? "hsl(142, 71%, 45%)" : "hsl(0, 84%, 60%)",
        strokeWidth: 1,
        selectable: false,
        evented: false,
      });

      // Body
      const bodyTop = Math.min(priceToY(candle.open), priceToY(candle.close));
      const bodyBottom = Math.max(priceToY(candle.open), priceToY(candle.close));
      const bodyHeight = Math.max(bodyBottom - bodyTop, 1);

      const body = new Rect({
        left: x - candleWidth / 4,
        top: bodyTop,
        width: candleWidth / 2,
        height: bodyHeight,
        fill: isBullish ? "hsl(142, 71%, 45%)" : "hsl(0, 84%, 60%)",
        selectable: false,
        evented: false,
      });

      fabricCanvas.add(wick, body);
    });

    fabricCanvas.renderAll();
  }, [fabricCanvas, candles]);

  const handleStartSelection = () => {
    if (!fabricCanvas) return;
    
    setIsSelecting(true);
    setSelectedRange(null);
    
    // Remove existing selection overlays
    const objects = fabricCanvas.getObjects();
    objects.forEach((obj) => {
      if ((obj as any).isSelection) {
        fabricCanvas.remove(obj);
      }
    });

    let firstClickX: number | null = null;
    let selectionOverlay: Rect | null = null;
    let leftBoundary: Line | null = null;
    let rightBoundary: Line | null = null;

    const handleClick = (e: any) => {
      const pointer = fabricCanvas.getPointer(e.e);
      const x = pointer.x;

      if (x < PADDING || x > CHART_WIDTH - PADDING) return;

      if (firstClickX === null) {
        // First click - draw left boundary
        firstClickX = x;
        leftBoundary = new Line([x, PADDING, x, CHART_HEIGHT - PADDING], {
          stroke: "hsl(30, 98%, 52%)",
          strokeWidth: 2,
          selectable: false,
          evented: false,
        });
        (leftBoundary as any).isSelection = true;
        fabricCanvas.add(leftBoundary);
        fabricCanvas.renderAll();
        toast.info("Click again to set the right boundary");
      } else {
        // Second click - draw right boundary and overlay
        const startX = Math.min(firstClickX, x);
        const endX = Math.max(firstClickX, x);

        rightBoundary = new Line([x, PADDING, x, CHART_HEIGHT - PADDING], {
          stroke: "hsl(30, 98%, 52%)",
          strokeWidth: 2,
          selectable: false,
          evented: false,
        });
        (rightBoundary as any).isSelection = true;

        selectionOverlay = new Rect({
          left: startX,
          top: PADDING,
          width: endX - startX,
          height: CHART_HEIGHT - PADDING * 2,
          fill: "rgba(255, 153, 0, 0.1)",
          stroke: "hsl(30, 98%, 52%)",
          strokeWidth: 2,
          selectable: false,
          evented: false,
        });
        (selectionOverlay as any).isSelection = true;

        fabricCanvas.add(selectionOverlay, rightBoundary);
        fabricCanvas.renderAll();

        // Calculate selected candle indices
        const candleWidth = (CHART_WIDTH - PADDING * 2) / candles.length;
        const startIndex = Math.floor((startX - PADDING) / candleWidth);
        const endIndex = Math.ceil((endX - PADDING) / candleWidth);

        setSelectedRange({
          start: Math.max(0, startIndex),
          end: Math.min(candles.length - 1, endIndex),
        });

        setIsSelecting(false);
        fabricCanvas.off("mouse:down", handleClick);
        toast.success("Fragment selected! Click 'Search Similar' to find matches.");
      }
    };

    fabricCanvas.on("mouse:down", handleClick);
  };

  const handleCancelSelection = () => {
    if (!fabricCanvas) return;

    setIsSelecting(false);
    setSelectedRange(null);

    // Remove selection overlays
    const objects = fabricCanvas.getObjects();
    objects.forEach((obj) => {
      if ((obj as any).isSelection) {
        fabricCanvas.remove(obj);
      }
    });

    fabricCanvas.off("mouse:down");
    fabricCanvas.renderAll();
  };

  const handleSearchSimilar = () => {
    if (!selectedRange) return;
    setSearchDialogOpen(true);
  };

  const handleSearch = (config: SearchConfig) => {
    if (!selectedRange) return;

    // Get the selected candle fragment
    const selectedCandles = candles.slice(selectedRange.start, selectedRange.end + 1);

    // Generate mock search results
    const mockResults: SimilarPattern[] = Array.from({ length: 5 }, (_, i) => ({
      id: `result-${i}`,
      similarity: 95 - i * 5,
      asset: config.assets[i % config.assets.length],
      date: new Date(Date.now() - i * 86400000 * 7).toISOString(),
      timeframe: timeframe,
      outcome: i % 2 === 0 ? "bullish" : "bearish",
      setupCandles: selectedCandles,
      outcomeCandles: generateMockCandles(20, selectedCandles[selectedCandles.length - 1].close, i % 2 === 0 ? "up" : "down"),
    }));

    setSearchResults(mockResults);
    setSearchDialogOpen(false);
    toast.success(`Found ${mockResults.length} similar patterns`);
  };

  const handleSaveToLibrary = (pattern: SimilarPattern) => {
    toast.success("Pattern saved to library");
  };

  const handleAddToCollection = () => {
    if (!selectedRange) return;
    const fragmentData = candles.slice(selectedRange.start, selectedRange.end + 1);
    setCurrentFragmentData(fragmentData);
    setAddToCollectionOpen(true);
  };

  const handleConfirmAddToCollection = (collectionId: string, result: SimilarPattern) => {
    addResultToCollection(collectionId, result);
  };

  return (
    <div className="min-h-screen bg-background">
      <ChartHeader />
      
      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>

        {/* Controls */}
        <div className="bg-card border border-border rounded-lg p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <SearchIcon className="w-4 h-4 text-muted-foreground" />
              <Input
                value={asset}
                onChange={(e) => setAsset(e.target.value)}
                placeholder="Search asset..."
                className="w-48"
              />
            </div>

            <Select value={timeframe} onValueChange={(v) => setTimeframe(v as Timeframe)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">1 min</SelectItem>
                <SelectItem value="5m">5 min</SelectItem>
                <SelectItem value="15m">15 min</SelectItem>
                <SelectItem value="1h">1 hour</SelectItem>
                <SelectItem value="4h">4 hours</SelectItem>
                <SelectItem value="1d">1 day</SelectItem>
              </SelectContent>
            </Select>

            <div className="h-6 w-px bg-border" />

            {!isSelecting && !selectedRange && (
              <Button
                type="button"
                onClick={handleStartSelection}
                variant="default"
              >
                Select Fragment
              </Button>
            )}

            {isSelecting && (
              <Button
                type="button"
                onClick={handleCancelSelection}
                variant="outline"
              >
                Cancel Selection
              </Button>
            )}

            {selectedRange && (
              <>
                <Button
                  type="button"
                  onClick={handleSearchSimilar}
                  className="bg-primary hover:bg-primary/90"
                >
                  Search Similar
                </Button>
                <Button
                  type="button"
                  onClick={handleAddToCollection}
                  variant="secondary"
                  className="gap-2"
                >
                  <FolderPlus className="w-4 h-4" />
                  Add to Collection
                </Button>
                <Button
                  type="button"
                  onClick={handleCancelSelection}
                  variant="outline"
                >
                  Clear Selection
                </Button>
                <span className="text-sm text-muted-foreground">
                  Selected: {selectedRange.end - selectedRange.start + 1} candles
                </span>
              </>
            )}
          </div>
        </div>

        {/* Chart */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">{asset} - {timeframe}</h2>
          <div className="flex justify-center">
            <canvas ref={canvasRef} className="border border-border rounded" />
          </div>
          {isSelecting && (
            <p className="text-center text-muted-foreground mt-4">
              Click on the chart to set the left boundary, then click again to set the right boundary
            </p>
          )}
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <SimilarityResults
            patterns={searchResults}
            onClose={() => setSearchResults([])}
            onSaveToLibrary={handleSaveToLibrary}
            setupCandles={selectedRange ? candles.slice(selectedRange.start, selectedRange.end + 1) : undefined}
          />
        )}
      </div>

      <SimilaritySearchDialog
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
        onSearch={handleSearch}
      />

      <AddToCollectionDialog
        open={addToCollectionOpen}
        onOpenChange={setAddToCollectionOpen}
        collections={collections}
        chartData={currentFragmentData}
        onAddToCollection={handleConfirmAddToCollection}
      />
    </div>
  );
};

export default AssetBrowser;
