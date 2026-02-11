import { AssetSearchInput } from "@/components/chart/AssetSearchInput";
import { CandleData } from "@/components/chart/MockChartDisplay";
import { SearchConfig, SimilaritySearchDialog } from "@/components/chart/SimilaritySearchDialog";
import { HomeHeader } from "@/components/HomeHeader";
import { AddToCollectionDialog } from "@/components/library/AddToCollectionDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  createChart,
  CrosshairMode,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  CandlestickSeries,
  ISeriesPrimitive,
  Time,
  IPrimitivePaneView,
  Logical,
  HistogramSeries
} from "lightweight-charts";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FolderPlus } from "lucide-react";
import { searchSimilarPatterns } from "@/lib/similarityCalculator";
import { SimilarPattern, storeSearchResults } from "./Results";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useCollections } from "@/hooks/useCollections";
import { getCandles, loadCandleData } from "@/data/candles";

type Timeframe = "1m" ;//| "5m" | "15m" | "1h" | "4h" | "1d";
const AVAILABLE_ASSETS = [
  { id: "GOLD", name: "Gold" }
];


class RangeSelectionPrimitive implements ISeriesPrimitive<Time> {
  private startLogical: number;
  private endLogical: number | null = null;
  private chart: IChartApi;

  constructor(chart: IChartApi, startLogical: number) {
    this.chart = chart;
    this.startLogical = startLogical;
  }

  updateEndLogical(logical: number) {
    this.endLogical = logical;
  }

  getRangeWidth() {
    return Math.abs(this.endLogical - this.startLogical);
  }

  paneViews(): IPrimitivePaneView[] {
    return [
      {
        renderer: () => ({
          draw: (target) => {
            target.useMediaCoordinateSpace((scope) => {
              const ctx = scope.context;
              const height = scope.mediaSize.height;
              const timeScale = this.chart.timeScale();

              const starXRight = timeScale.logicalToCoordinate(this.startLogical as Logical);
              const starXLeft = timeScale.logicalToCoordinate(this.startLogical - 1 as Logical);

              const startX = (starXLeft + starXRight) / 2;

              const endX =
                this.endLogical !== null
                  ? (timeScale.logicalToCoordinate(this.endLogical as Logical) + timeScale.logicalToCoordinate(this.endLogical - 1 as Logical)) / 2
                  : null;

              if (startX === null) return;

              ctx.save();

              if (endX === null) {
                // First click: vertical line
                ctx.strokeStyle = "rgba(80,160,255,0.9)";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(startX, 0);
                ctx.lineTo(startX, height);
                ctx.stroke();
              } else {
                // Final range
                const left = Math.min(startX, endX);
                const width = Math.abs(endX - startX);

                const candlesNumber = Math.abs(this.endLogical - this.startLogical);
                if (candlesNumber < 2 || candlesNumber > 100) {
                  ctx.fillStyle = "rgba(255, 80, 160, 0.2)";
                  ctx.strokeStyle = "rgba(255, 80, 160, 0.9)";
                  ctx.lineWidth = 2;
                } else {
                  ctx.fillStyle = "rgba(80,160,255,0.2)";
                  ctx.strokeStyle = "rgba(80,160,255,0.9)";
                  ctx.lineWidth = 2;
                }

                ctx.fillRect(left, 0, width, height);
                ctx.strokeRect(left, 0, width, height);
              }

              ctx.restore();
            });
          },
        }),
      },
    ];
  }
}

const AssetBrowser = () => {
const navigate = useNavigate();
const chartRef = useRef<HTMLDivElement | null>(null);
const chartApiRef = useRef<IChartApi | null>(null);
const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
const volumeRef = useRef<ISeriesApi<"Histogram"> | null>(null);
const [candles, setCandles] = useState<CandleData[]>([]);
const [asset, setAsset] = useState("GOLD");
const [timeframe, setTimeframe] = useState<Timeframe>("1m");
const clickHandlerRef = useRef<((param: any) => void) | null>(null);
const crosshairHandlerRef = useRef<((param: any) => void) | null>(null);
const [isSelecting, setIsSelecting] = useState(false);
const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(null);
const [searchDialogOpen, setSearchDialogOpen] = useState(false);
const selectionPrimitiveRef = useRef<RangeSelectionPrimitive | null>(null);
const [addToCollectionOpen, setAddToCollectionOpen] = useState(false);
const { collections, addResultToCollection } = useCollections();
const [currentFragmentData, setCurrentFragmentData] = useState<CandleData[]>([]);
const [outcomeData, setOutcomeData] = useState<CandleData[]>([]);

useEffect(() => {
  const loadData = async () => {
    const allData = await getCandles(asset, timeframe);
    const candleData = allData.slice(allData.length - 2000);

    setCandles(candleData);
  };

  loadData();
}, [asset, timeframe]);

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

  const volumeSeries = chart.addSeries(HistogramSeries, {
    priceFormat: {
        type: 'volume',
    },
    priceScaleId: '', // set as an overlay by setting a blank priceScaleId
  });
  volumeSeries.priceScale().applyOptions({
      // set the positioning of the volume series
      scaleMargins: {
          top: 0.8, // highest point of the series will be 70% away from the top
          bottom: 0,
      },
  });

  const series = chart.addSeries(CandlestickSeries);

  chartApiRef.current = chart;
  seriesRef.current = series;
  volumeRef.current = volumeSeries;

  return () => chart.remove();
}, []);

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
  if (!seriesRef.current || candles.length < 1) return;

  const data: CandlestickData<Time>[] = candles.map(c => ({
    time: Math.floor(new Date(c.ctm).getTime() / 1000) as Time,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
  }));

  seriesRef.current.setData(data);

  const volumeData = candles.map(c => ({
    time: Math.floor(new Date(c.ctm).getTime() / 1000) as Time,
    value: c.vol,
    color: c.open >= c.close ? '#26a69983' : '#ef535080'
  }));

  volumeRef.current.setData(volumeData);
}, [candles]);

const startSelection = () => {
  const chart = chartApiRef.current;
  const series = seriesRef.current;
  if (!chart || !series) return;

  setIsSelecting(true);
  setSelectedRange(null);

  const handleClick = (param: any) => {
    if (param.logical === undefined) return;

    if (!selectionPrimitiveRef.current) {
      const primitive = new RangeSelectionPrimitive(
        chart,
        param.logical as Logical
      );
      selectionPrimitiveRef.current = primitive;
      series.attachPrimitive(primitive);
    } else {
      const primitive = selectionPrimitiveRef.current;
      const rangeWidth = primitive.getRangeWidth();
      if (rangeWidth < 2 || rangeWidth > 100) {
        toast.error("Select between 2 and 100 candles");
      } else {
        finalizeSelection(param.logical as Logical);
      }
    }
  };

  const handleMove = (param: any) => {
    if (
      !selectionPrimitiveRef.current ||
      param.logical === undefined
    )
      return;

    selectionPrimitiveRef.current.updateEndLogical(
      param.logical as Logical
    );

    const range = chart.timeScale().getVisibleLogicalRange();
    if (range) {
      chart.timeScale().setVisibleLogicalRange(range);
    }
  };

  clickHandlerRef.current = handleClick;
  crosshairHandlerRef.current = handleMove;

  chart.subscribeClick(handleClick);
  chart.subscribeCrosshairMove(handleMove);
};


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


const finalizeSelection = (endLogical: number) => {
  const primitive = selectionPrimitiveRef.current;
  if (!primitive) return;

  primitive.updateEndLogical(endLogical);

  const start = Math.min(
    primitive["startLogical"],
    endLogical
  );
  const end = Math.max(
    primitive["startLogical"],
    endLogical
  );

  setSelectedRange({ start, end });

  setIsSelecting(false);
  cleanupSelectionListeners();
};


const cancelSelection = () => {
  const chart = chartApiRef.current;
  const series = seriesRef.current;

  // 1️⃣ Remove primitive from chart
  if (selectionPrimitiveRef.current && series) {
    series.detachPrimitive(selectionPrimitiveRef.current);
    selectionPrimitiveRef.current = null;
  }

  // 2️⃣ Cleanup listeners
  cleanupSelectionListeners();

  // 3️⃣ Reset state
  setIsSelecting(false);
  setSelectedRange(null);
};

 const handleSearchSimilar = () => {
    if (!selectedRange) return;
    setSearchDialogOpen(true);
  };

const handleSearch = async (config: SearchConfig) => {
    if (!selectedRange) return;
    // Get the selected candle fragment
    const selectedCandles = candles.slice(selectedRange.start, selectedRange.end);

    // Search through all imported data for similar patterns
    const allData = await loadCandleData();
    const searchResults = searchSimilarPatterns(
      selectedCandles,
      await loadCandleData(),
      config
    );

    // Convert search results to SimilarPattern format
    const patterns: SimilarPattern[] = searchResults.map((result) => ({
      id: result.id,
      similarity: result.similarity,
      asset: result.asset,
      date: result.date,
      timeframe: result.timeframe,
      outcome: result.outcome,
      setupCandles: result.setupCandles,
      outcomeCandles: result.outcomeCandles,
    }));

    setSearchDialogOpen(false);
    
    if (patterns.length === 0) {
      toast.info("No similar patterns found. Try lowering the similarity threshold.");
    } else {
      // Store results and navigate to results page
      storeSearchResults(patterns, selectedCandles);
      navigate("/results");
    }
  };
  
  const handleAddToCollection = () => {
    if (!selectedRange) return;
    const fragmentData = candles.slice(selectedRange.start, selectedRange.end);
    const outcome = candles.slice(selectedRange.end, selectedRange.end + 100);

    setCurrentFragmentData(fragmentData);
    setOutcomeData(outcome);
    setAddToCollectionOpen(true);
  };

  const handleConfirmAddToCollection = (collectionId: string, result: SimilarPattern) => {
    addResultToCollection(collectionId, result);
  };

return (
    <div className="min-h-screen bg-background">
      <HomeHeader />
      
      <div className="container mx-auto px-6 py-6">
       
        {/* Controls */}
        <div className="bg-card border border-border rounded-lg p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <AssetSearchInput
                assets={AVAILABLE_ASSETS}
                selectedAssets={[asset]}
                onAssetSelect={(assetId) => setAsset(assetId)}
                placeholder="Search asset..."
                className="w-64"
              />
            </div>

            <Select value={timeframe} onValueChange={(v) => setTimeframe(v as Timeframe)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">1 min</SelectItem>
                {/* <SelectItem value="5m">5 min</SelectItem>
                <SelectItem value="15m">15 min</SelectItem>
                <SelectItem value="1h">1 hour</SelectItem>
                <SelectItem value="4h">4 hours</SelectItem>
                <SelectItem value="1d">1 day</SelectItem> */}
              </SelectContent>
            </Select>

            <div className="h-6 w-px bg-border" />

            {!isSelecting && !selectedRange && (
              <Button
                type="button"
                onClick={startSelection}
                variant="default"
              >
                Select Fragment
              </Button>
            )}

            {isSelecting && (
              <Button
                type="button"
                onClick={cancelSelection}
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
                  onClick={cancelSelection}
                  variant="outline"
                >
                  Clear Selection
                </Button>
                <span className="text-sm text-muted-foreground">
                  Selected: {selectedRange.end - selectedRange.start} candles
                </span>
              </>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            {asset} – {timeframe}
          </h2>

          <div
            ref={chartRef}
            className="w-full h-[600px]" // or h-full inside a flex container
          />
           {isSelecting && (
            <p className="text-center text-muted-foreground mt-4">
              Click on the chart to set the left boundary, then click again to set the right boundary
            </p>
          )}
        </div>
      </div>

      {selectedRange && 
        <SimilaritySearchDialog
          open={searchDialogOpen}
          onOpenChange={setSearchDialogOpen}
          onSearch={handleSearch}
          patternLength={selectedRange.end - selectedRange.start}
        />
      }

      <AddToCollectionDialog
        open={addToCollectionOpen}
        onOpenChange={setAddToCollectionOpen}
        collections={collections}
        chartData={currentFragmentData}
        outcomeData={outcomeData}
        onAddToCollection={handleConfirmAddToCollection}
      />
    </div>
  );
}

export default AssetBrowser;

