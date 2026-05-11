import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Layers,
  BookmarkPlus,
  X,
  TrendingUp,
  TrendingDown,
  Settings,
  Save,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { MockChartDisplay, generateMockCandles, CandleData } from "./MockChartDisplay";
import { TradeStatistics, TradeStats } from "./TradeStatistics";
import { OverlayChartCanvas } from "./OverlayChartCanvas";
import { DetailChartCanvas } from "./DetailChartCanvas";
import { BaseChartCanvas } from "./BaseChartCanvas";
import { SaveToLibraryDialog } from "@/components/library/SaveToLibraryDialog";
import { useCollections } from "@/hooks/useCollections";
import { Logical, Time } from "lightweight-charts";
import { IndividualTradeStatistics } from "./IndividualTradeStatistics";

export interface SimilarPattern {
  id: string;
  asset: string;
  similarity: number;
  date: string;
  timeframe: string;
  outcome: "bullish" | "bearish" | "neutral";
  setupCandles?: CandleData[];
  outcomeCandles?: CandleData[];
  virtualTradeResult?: {
    profit: number;
    outcome: "win" | "loss" | "timeout";
    duration: number;
  };
}

interface SimilarityResultsProps {
  patterns: SimilarPattern[];
  onClose: () => void;
  onSaveToLibrary: (pattern: SimilarPattern) => void;
  setupCandles?: CandleData[];
  onSaveAsCollection?: (name: string) => void;
  onRemovePattern?: (patternId: string) => void;
  collectionName?: string;
}

export interface TransactionBoxModel {
  entryPrice: number;        // where profit & loss meet
  profitSize: number;        // height
  lossSize: number;          // height
  startTime: Time;           // start timestamp
  endTime: Time;             // end timestamp
  position: "long" | "short";
}

export const SimilarityResults = ({
  patterns,
  onClose,
  onSaveToLibrary,
  setupCandles,
  onSaveAsCollection,
  onRemovePattern,
  collectionName,
}: SimilarityResultsProps) => {
  const { collections, addCollection } = useCollections();
  const [viewMode, setViewMode] = useState<"base" | "grid" | "detail" | "overlay">("grid");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sortBy, setSortBy] = useState<"similarity" | "date">("similarity");
  const [filterAsset, setFilterAsset] = useState<string>("all");
  const [outcomeChartType, setOutcomeChartType] = useState<"candle" | "line">("candle");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [baseChartType, setBaseChartType] = useState<"candle" | "line">("candle");
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const transactionParams = useRef<TransactionBoxModel | null>(null);
  
  const setTransactionParams = (newTransactionParams: TransactionBoxModel) => {
    transactionParams.current = newTransactionParams;
  }

  const settersRef = useRef<Array<(v: TransactionBoxModel) => void>>([setTransactionParams]);

  const registerTransactionChangester = (fn: (v: TransactionBoxModel) => void) => {
    settersRef.current.push(fn);
  };

  const triggerAll = (val: TransactionBoxModel) => {
    settersRef.current.forEach((fn) => fn(val));
  };

  const sortedPatterns = [...patterns].sort((a, b) => {
    if (sortBy === "similarity") {
      return b.similarity - a.similarity;
    }
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const filteredPatterns =
    filterAsset === "all"
      ? sortedPatterns
      : sortedPatterns.filter((p) => p.asset === filterAsset);

  const normalize = (price: number, min: number, max: number) => {
    return (price - min) / (max - min) + 100;
  }

  // Prepare outcomes data
  const normalizedPatterns = filteredPatterns.map((pattern) => {
    const setupMin = Math.min(...pattern.setupCandles.map(candle => candle.low));
    const setupMax = Math.max(...pattern.setupCandles.map(candle => candle.high));

    const lastIndex = pattern.setupCandles.length - 1;
    const setupOffset = 100 - normalize(pattern.setupCandles[lastIndex].close, setupMin, setupMax);

    const normalizedSetup = pattern.setupCandles.map(setupCandle => { 
      return { ...setupCandle,
        open: normalize(setupCandle.open, setupMin, setupMax) + setupOffset,
        high: normalize(setupCandle.high, setupMin, setupMax) + setupOffset,
        low: normalize(setupCandle.low, setupMin, setupMax) + setupOffset,
        close: normalize(setupCandle.close, setupMin, setupMax) + setupOffset,
      }
    });

    const normalizedOutcome = pattern.outcomeCandles.map(outcomeCandle => { 
      return { ...outcomeCandle,
        open: normalize(outcomeCandle.open, setupMin, setupMax) + setupOffset,
        high: normalize(outcomeCandle.high, setupMin, setupMax) + setupOffset,
        low: normalize(outcomeCandle.low, setupMin, setupMax) + setupOffset,
        close: normalize(outcomeCandle.close, setupMin, setupMax) + setupOffset,
      }
    });

    
  return { ...pattern,
    setupCandles: normalizedSetup,
    outcomeCandles: normalizedOutcome
  }
});
 

  const setupMin = Math.min(...setupCandles.map(candle => candle.low));
  const setupMax = Math.max(...setupCandles.map(candle => candle.high));
  const lastIndex = setupCandles.length - 1;
  const baseChartOffset = 100 - normalize(setupCandles[lastIndex].close, setupMin, setupMax);

  const normalizedSetupCandles = setupCandles.map(setup => { 
      return { ...setup,
        open: normalize(setup.open, setupMin, setupMax) + baseChartOffset,
        high: normalize(setup.high, setupMin, setupMax) + baseChartOffset,
        low: normalize(setup.low, setupMin, setupMax) + baseChartOffset,
        close: normalize(setup.close, setupMin, setupMax) + baseChartOffset,
      }
    });


  const uniqueAssets = Array.from(new Set(patterns.map((p) => p.asset)));

  const handleSavePattern = (pattern: SimilarPattern) => {
    onSaveToLibrary(pattern);
    toast.success(`Pattern saved to library: ${pattern.asset} - ${pattern.similarity}%`);
  };


  const handleSaveToLibrary = (name: string) => {
    addCollection(name, setupCandles, patterns);
    toast.success(`Collection "${name}" saved to library`);
  };

  const handleRemovePattern = () => {
    const patternToRemove = filteredPatterns[currentIndex];
    if (patternToRemove && onRemovePattern) {
      onRemovePattern(patternToRemove.id);
      // Adjust index if we removed the last item
      if (currentIndex >= filteredPatterns.length - 1 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    }
    setRemoveDialogOpen(false);
    toast.success("Pattern removed from results");
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto h-full flex flex-col py-6 min-h-0">
        {/* Header with Controls */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap flex-shrink-0">
          {/* Left: Title and Navigation */}
          <div className="flex items-center gap-4 min-w-0 flex-1">
            {collectionName ? (
              <div className="min-w-0 flex-shrink" title={collectionName}>
                <h2 className="text-2xl font-bold text-foreground truncate max-w-[200px] md:max-w-[300px] lg:max-w-[400px]">
                  {collectionName}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {filteredPatterns.length} patterns
                </p>
              </div>
            ) : (
              <div className="flex-shrink-0">
                <h2 className="text-2xl font-bold text-foreground">
                  Similar Patterns Found
                </h2>
                <p className="text-sm text-muted-foreground">
                  {filteredPatterns.length} matches across {uniqueAssets.length} assets
                </p>
              </div>
            )}

            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="flex-shrink-0">
              <TabsList>
                <TabsTrigger value="base" className="gap-2">
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Base Chart</span>
                </TabsTrigger>
                <TabsTrigger value="grid" className="gap-2">
                  <LayoutGrid className="w-4 h-4" />
                  <span className="hidden sm:inline">Grid</span>
                </TabsTrigger>
                <TabsTrigger value="detail" className="gap-2">
                  <ChevronRight className="w-4 h-4" />
                  <span className="hidden sm:inline">Detail</span>
                </TabsTrigger>
                <TabsTrigger value="overlay" className="gap-2">
                  <Layers className="w-4 h-4" />
                  <span className="hidden sm:inline">Overlay</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {!collectionName && (
              <Button
                variant="default"
                className="gap-2 flex-shrink-0"
                onClick={() => setSaveDialogOpen(true)}
              >
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">Save Results</span>
              </Button>
            )}
          </div>

          {/* Right: Filters and Close */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Select value={filterAsset} onValueChange={setFilterAsset}>
              <SelectTrigger className="w-32 md:w-40">
                <SelectValue placeholder="Filter asset" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assets</SelectItem>
                {uniqueAssets.map((asset) => (
                  <SelectItem key={asset} value={asset}>
                    {asset}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-32 md:w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="similarity">By Similarity</SelectItem>
                <SelectItem value="date">By Date</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <TradeStatistics
        registerTransactionChange={registerTransactionChangester} 
        // outcomes={normalizedPatterns}
        outcomes={filteredPatterns}
        />
        

        {/* Content */}
        <div className="flex-1 overflow-hidden min-h-0">
          {viewMode === "base" && (
            <ScrollArea className="h-full">
              <div className="pb-6">
                <BaseChartCanvas
                  candles={setupCandles}
                  chartType={baseChartType}
                  onChartTypeChange={setBaseChartType}
                />
              </div>
            </ScrollArea>
          )}

          {viewMode === "grid" && (
            <ScrollArea className="h-full">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
                {filteredPatterns.map((pattern) => (
                  <PatternCard
                    key={pattern.id}
                    pattern={pattern}
                    onClick={() => {
                      setCurrentIndex(filteredPatterns.indexOf(pattern));
                      setViewMode("detail");
                    }}
                  />
                ))}
              </div>
            </ScrollArea>
          )}

          {viewMode === "detail" && filteredPatterns.length > 0 && (
            <div className="flex flex-col h-full">
              <div className="flex-1 h-full overflow-hidden">
                <PatternDetailView
                  baseChart={setupCandles}
                  pattern={filteredPatterns[currentIndex]}
                  onSave={() => handleSavePattern(filteredPatterns[currentIndex])}
                  onRemove={onRemovePattern ? () => setRemoveDialogOpen(true) : undefined}
                  registerTransactionChange={registerTransactionChangester}
                  transactionParams={transactionParams.current}
                />
              </div>
              <div className="flex items-center justify-between mt-6 pt-6 border-t flex-shrink-0">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                    disabled={currentIndex === 0}
                    className="gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {currentIndex + 1} of {filteredPatterns.length}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setCurrentIndex(
                        Math.min(filteredPatterns.length - 1, currentIndex + 1)
                      )
                    }
                    disabled={currentIndex === filteredPatterns.length - 1}
                    className="gap-2"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
            </div>
          )}

          {viewMode === "overlay" && (
            <div className="h-full">
              <OverlayView
                patterns={normalizedPatterns}
                setupCandles={normalizedSetupCandles}
                chartType={outcomeChartType}
                onChartTypeChange={setOutcomeChartType}
                onTransactionParamsChange={triggerAll}
                initialTransactionParams={transactionParams.current}
              />
            </div>
          )}
        </div>
      </div>

      <SaveToLibraryDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={handleSaveToLibrary}
        collectionNames={collections.map(collection => collection.name)}
      />

      {/* Remove Pattern Confirmation Dialog */}
      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <DialogTitle>Remove Pattern</DialogTitle>
            </div>
            <DialogDescription className="pt-3 text-left">
              Removing this pattern will affect the overall statistics calculated for these results. 
              Only remove patterns that don't meet your strategy criteria beyond similarity score.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-border bg-card/50 p-4 mt-2">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Tip:</span> Remove patterns where the market context 
              (news events, unusual volatility, etc.) doesn't align with your trading strategy.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="outline" onClick={() => setRemoveDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemovePattern} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Remove Pattern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const PatternCard = ({
  pattern,
  onClick,
}: {
  pattern: SimilarPattern;
  onClick?: () => void;
}) => {
  const outcomeIcon =
    pattern.outcome === "bullish" ? (
      <TrendingUp className="w-4 h-4 text-bullish" />
    ) : pattern.outcome === "bearish" ? (
      <TrendingDown className="w-4 h-4 text-bearish" />
    ) : null;

  const candles = pattern.setupCandles;

  return (
    <Card className="p-4 hover:shadow-glow transition-all cursor-pointer group" onClick={onClick}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-foreground">{pattern.asset}</h3>
          <p className="text-sm text-muted-foreground">{pattern.timeframe}</p>
        </div>
        <Badge variant="secondary" className="bg-primary/10 text-primary">
          {pattern.similarity}%
        </Badge>
      </div>

      <MockChartDisplay candles={candles} width={300} height={120} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {outcomeIcon}
          <span className="text-xs text-muted-foreground">{new Date(pattern.date).toLocaleDateString()}, {new Date(pattern.date).toLocaleTimeString()}</span>
        </div>
      </div>
    </Card>
  );
};

interface PatternDetailViewProps {
  baseChart: CandleData[];
  pattern: SimilarPattern;
  onSave: () => void;
  onRemove?: () => void;
  registerTransactionChange: (fn: (v: TransactionBoxModel) => void) => void;
  transactionParams: TransactionBoxModel;
}

const PatternDetailView = ({
  baseChart,
  pattern,
  onSave,
  onRemove,
  registerTransactionChange,
  transactionParams
}: PatternDetailViewProps) => {
  const [chartType, setChartType] = useState<"candle" | "line">("candle");

  const normalize = (price: number, min: number, max: number) => {
    return (price - min) / (max - min) + 100;
  }

  const setupMin = Math.min(...pattern.setupCandles.map(candle => candle.low));
  const setupMax = Math.max(...pattern.setupCandles.map(candle => candle.high));
  const setupCandles = pattern.setupCandles
  const outcomeCandles = pattern.outcomeCandles

  
  const baseMin = normalize(Math.min(...baseChart.map(candle => candle.low)), setupMin, setupMax);
  const baseMax = normalize(Math.max(...baseChart.map(candle => candle.high)), setupMin, setupMax);
  const baseCandles = baseChart.map(baseCandle => { 
      return { ...baseCandle,
        open: normalize(baseCandle.open, baseMin, baseMax),
        high: normalize(baseCandle.high, baseMin, baseMax),
        low: normalize(baseCandle.low, baseMin, baseMax),
        close: normalize(baseCandle.close, baseMin, baseMax),
      }
    });

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0">
        <div>
          <p className="text-muted-foreground mt-1">
            {pattern.asset} • {new Date(pattern.date).toLocaleDateString()} • {pattern.timeframe}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {onRemove && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRemove}
              className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </Button>
          )}
          <Badge variant="secondary" className="bg-primary/10 text-primary text-lg px-4 py-2">
            {pattern.similarity}% Match
          </Badge>
        </div>
      </div>

      <div className="flex-shrink-0">
        <IndividualTradeStatistics 
          individualOutcome={pattern}
          transactionParams={transactionParams} />
      </div>

      <div className="flex-1 h-full">
        <DetailChartCanvas
          baseChart={baseCandles}
          setupCandles={setupCandles}
          outcomeCandles={outcomeCandles}
          chartType={chartType}
          onChartTypeChange={setChartType}
          transactionParams={transactionParams}
        />
      </div>
    </div>
  );
};

const OverlayView = ({
  patterns,
  setupCandles,
  chartType,
  onChartTypeChange,
  onTransactionParamsChange,
  initialTransactionParams
}: {
  patterns: SimilarPattern[];
  setupCandles: CandleData[];
  chartType: "candle" | "line";
  onChartTypeChange: (type: "candle" | "line") => void;
  onTransactionParamsChange: (params: TransactionBoxModel | null) => void;
  initialTransactionParams: TransactionBoxModel | null;
}) => {

  // Prepare outcomes data
  const outcomesData = patterns.map((pattern) => {
    return pattern.outcomeCandles;
  });


  return (
    <ScrollArea className="h-full">
      <div className="space-y-6 pb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-foreground">Unified Overlay Analysis</h3>
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

        <Card className="p-6">
          <div className="mb-4">
            <h4 className="text-lg font-semibold text-foreground mb-1">Setup Pattern + Outcome Overlays</h4>
            <p className="text-sm text-muted-foreground">
              Setup on the left, outcomes on the right. Draw a transaction box to test your strategy. Entry price will always be set at the opening of the first candle of the outcome chart.
            </p>
          </div>
          
          <OverlayChartCanvas
            setupCandles={setupCandles}
            outcomesData={outcomesData}
            chartType={chartType}
            onTransactionBoxChange={onTransactionParamsChange}
            initialTransactionParams={initialTransactionParams}
          />
        </Card>

        <Card className="p-6">
          <h4 className="text-lg font-semibold text-foreground mb-4">Pattern Insights</h4>
          <p className="text-sm text-muted-foreground">
            The unified overlay shows the setup pattern (left of divider) and overlaid outcome continuations (right of divider).
            Denser overlapping areas indicate more frequent price action. Draw a transaction box to simulate trade outcomes.
          </p>
        </Card>
      </div>
    </ScrollArea>
  );
};
