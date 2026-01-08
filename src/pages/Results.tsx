import { useState, useEffect, useCallback } from "react";
import { useNavigate, useBlocker } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Layers,
  TrendingUp,
  TrendingDown,
  Save,
  AlertTriangle,
  Home,
  FileSearch,
  Library,
} from "lucide-react";
import { toast } from "sonner";
import { MockChartDisplay, generateMockCandles, CandleData } from "@/components/chart/MockChartDisplay";
import { VirtualTransactionDialog, VirtualTransactionParams } from "@/components/chart/VirtualTransactionDialog";
import { TradeStatistics, TradeStats, IndividualTradeStats } from "@/components/chart/TradeStatistics";
import { OverlayChartCanvas } from "@/components/chart/OverlayChartCanvas";
import { DetailChartCanvas } from "@/components/chart/DetailChartCanvas";
import { BaseChartCanvas } from "@/components/chart/BaseChartCanvas";
import { SaveToLibraryDialog } from "@/components/library/SaveToLibraryDialog";
import { useCollections } from "@/hooks/useCollections";
import { HomeHeader } from "@/components/HomeHeader";
import { TransactionBoxModel } from "@/components/chart/SimilarityResults";

const RESULTS_STORAGE_KEY = "similarity_search_results";
const SETUP_CANDLES_STORAGE_KEY = "similarity_search_setup_candles";

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

// Helper functions to store/retrieve results
export const storeSearchResults = (patterns: SimilarPattern[], setupCandles: CandleData[]) => {
  sessionStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify(patterns));
  sessionStorage.setItem(SETUP_CANDLES_STORAGE_KEY, JSON.stringify(setupCandles));
};

export const clearSearchResults = () => {
  sessionStorage.removeItem(RESULTS_STORAGE_KEY);
  sessionStorage.removeItem(SETUP_CANDLES_STORAGE_KEY);
};

const Results = () => {
  const navigate = useNavigate();
  const { collections, addCollection } = useCollections();
  const [patterns, setPatterns] = useState<SimilarPattern[]>([]);
  const [setupCandles, setSetupCandles] = useState<CandleData[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const [viewMode, setViewMode] = useState<"base" | "grid" | "detail" | "overlay">("grid");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sortBy, setSortBy] = useState<"similarity" | "date">("similarity");
  const [filterAsset, setFilterAsset] = useState<string>("all");
  const [virtualTransactionOpen, setVirtualTransactionOpen] = useState(false);
  const [outcomeChartType, setOutcomeChartType] = useState<"candle" | "line">("candle");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [baseChartType, setBaseChartType] = useState<"candle" | "line">("candle");
  const [transactionParams, setTransactionParams] = useState<TransactionBoxModel | null>(null);

  // Load results from sessionStorage on mount
  useEffect(() => {
    const storedPatterns = sessionStorage.getItem(RESULTS_STORAGE_KEY);
    const storedSetupCandles = sessionStorage.getItem(SETUP_CANDLES_STORAGE_KEY);

    if (storedPatterns) {
      try {
        setPatterns(JSON.parse(storedPatterns));
      } catch (e) {
        console.error("Failed to parse stored patterns:", e);
      }
    }

    if (storedSetupCandles) {
      try {
        setSetupCandles(JSON.parse(storedSetupCandles));
      } catch (e) {
        console.error("Failed to parse stored setup candles:", e);
      }
    }
  }, []);

  // Warn before page unload if results are unsaved
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isSaved && patterns.length > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isSaved, patterns.length]);

  // Block navigation within the app
  const blocker = useBlocker(
    useCallback(() => !isSaved && patterns.length > 0, [isSaved, patterns.length])
  );

  useEffect(() => {
    if (blocker.state === "blocked") {
      setShowLeaveWarning(true);
    }
  }, [blocker.state]);

  const handleConfirmLeave = () => {
    setShowLeaveWarning(false);
    if (blocker.state === "blocked") {
      blocker.proceed();
    }
  };

  const handleCancelLeave = () => {
    setShowLeaveWarning(false);
    if (blocker.state === "blocked") {
      blocker.reset();
    }
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

  const uniqueAssets = Array.from(new Set(patterns.map((p) => p.asset)));


  const handleApplyVirtualTransaction = (params: VirtualTransactionParams) => {
    setTransactionParams({ ...params });
    toast.success("Virtual transaction parameters applied");
  };

  const calculateStats = (): TradeStats | null => {
    if (!transactionParams) {
      return null;
    }

    const outcomesData = filteredPatterns.map((pattern) => {
      return pattern.outcomeCandles;
    });

    const trades = outcomesData.map((outcome) => {
      if (!outcome || outcome.length === 0) return null;

      const entryPrice = outcome[0].open;
      const isLong = transactionParams.position === "long";
      const takeProfitPrice = entryPrice * (1 + transactionParams.takeProfit / 100 * (isLong ? 1 : -1));
      const stopLossPrice = entryPrice * (1 - transactionParams.stopLoss / 100 * (isLong ? 1 : -1));

      let result: "win" | "loss" | "timeout" = "timeout";
      let profit = 0;
      let duration = transactionParams.timeHorizon;

      for (let i = 0; i < Math.min(outcome.length, transactionParams.timeHorizon); i++) {
        const candle = outcome[i];
        if (isLong) {
          if (candle.high >= takeProfitPrice) {
            result = "win";
            profit = transactionParams.takeProfit;
            duration = i + 1;
            break;
          } else if (candle.low <= stopLossPrice) {
            result = "loss";
            profit = -transactionParams.stopLoss;
            duration = i + 1;
            break;
          }
        } else {
          if (candle.low <= takeProfitPrice) {
            result = "win";
            profit = transactionParams.takeProfit;
            duration = i + 1;
            break;
          } else if (candle.high >= stopLossPrice) {
            result = "loss";
            profit = -transactionParams.stopLoss;
            duration = i + 1;
            break;
          }
        }
      }

      if (result === "timeout") {
        const lastCandle = outcome[Math.min(outcome.length - 1, transactionParams.timeHorizon - 1)];
        profit = isLong
          ? ((lastCandle.close - entryPrice) / entryPrice) * 100
          : ((entryPrice - lastCandle.close) / entryPrice) * 100;
      }

      return { result, profit, duration };
    }).filter(t => t !== null);

    const wins = trades.filter(t => t!.result === "win").length;
    const avgProfit = trades.reduce((acc, t) => acc + t!.profit, 0) / trades.length;
    const avgDuration = trades.reduce((acc, t) => acc + t!.duration, 0) / trades.length;

    return {
      winRate: (wins / trades.length) * 100,
      avgProfit,
      totalTrades: trades.length,
      avgDuration,
    };
  };

  const getIndividualStats = (pattern: SimilarPattern): IndividualTradeStats | undefined => {
    if (!transactionParams) return undefined;

    const outcomeCandles = pattern.outcomeCandles || generateMockCandles(
      15,
      setupCandles?.[setupCandles.length - 1]?.close || 100,
      pattern.outcome === "bullish" ? "up" : pattern.outcome === "bearish" ? "down" : "sideways"
    );

    const entryPrice = outcomeCandles[0].open;
    const isLong = transactionParams.position === "long";
    const takeProfitPrice = entryPrice * (1 + transactionParams.takeProfit / 100 * (isLong ? 1 : -1));
    const stopLossPrice = entryPrice * (1 - transactionParams.stopLoss / 100 * (isLong ? 1 : -1));

    let result: "win" | "loss" | "timeout" = "timeout";
    let profit = 0;
    let duration = transactionParams.timeHorizon;

    for (let i = 0; i < Math.min(outcomeCandles.length, transactionParams.timeHorizon); i++) {
      const candle = outcomeCandles[i];
      if (isLong) {
        if (candle.high >= takeProfitPrice) {
          result = "win";
          profit = transactionParams.takeProfit;
          duration = i + 1;
          break;
        } else if (candle.low <= stopLossPrice) {
          result = "loss";
          profit = -transactionParams.stopLoss;
          duration = i + 1;
          break;
        }
      } else {
        if (candle.low <= takeProfitPrice) {
          result = "win";
          profit = transactionParams.takeProfit;
          duration = i + 1;
          break;
        } else if (candle.high >= stopLossPrice) {
          result = "loss";
          profit = -transactionParams.stopLoss;
          duration = i + 1;
          break;
        }
      }
    }

    if (result === "timeout") {
      const lastCandle = outcomeCandles[Math.min(outcomeCandles.length - 1, transactionParams.timeHorizon - 1)];
      profit = isLong
        ? ((lastCandle.close - entryPrice) / entryPrice) * 100
        : ((entryPrice - lastCandle.close) / entryPrice) * 100;
    }

    return {
      profit,
      similarity: pattern.similarity,
      asset: pattern.asset,
      timeframe: pattern.timeframe,
      date: pattern.date,
      outcome: result,
    };
  };

  const handleSaveToLibrary = (name: string) => {
    try{
      addCollection(name, setupCandles, patterns);
    } catch (e) {
      toast.success(`We couldn't save your collection. Try removing some old collections first.`);
    }
    setIsSaved(true);
    clearSearchResults();
    toast.success(`Collection "${name}" saved to library`);
  };

  // Show empty state if no results
  if (patterns.length === 0) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <HomeHeader />
        <div className="flex-1 flex items-center justify-center">
          <Card className="p-8 text-center max-w-md">
            <FileSearch className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No Results Found</h2>
            <p className="text-muted-foreground mb-6">
              There are no similarity search results to display. Run a similarity search from the Chart or Browse Assets page.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate("/chart")} className="gap-2">
                Go to Chart
              </Button>
              <Button onClick={() => navigate("/browse-assets")} variant="outline" className="gap-2">
                Browse Assets
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <HomeHeader/>

      <div className="container mx-auto flex-1 flex flex-col py-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-foreground">
              Similar Patterns Found
            </h2>
            <p className="text-muted-foreground mt-1">
              {filteredPatterns.length} matches across {uniqueAssets.length} assets
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
              <TabsList>
                <TabsTrigger value="base" className="gap-2">
                  <ChevronLeft className="w-4 h-4" />
                  Base Chart
                </TabsTrigger>
                <TabsTrigger value="grid" className="gap-2">
                  <LayoutGrid className="w-4 h-4" />
                  Grid
                </TabsTrigger>
                <TabsTrigger value="detail" className="gap-2">
                  <ChevronRight className="w-4 h-4" />
                  Detail
                </TabsTrigger>
                <TabsTrigger value="overlay" className="gap-2">
                  <Layers className="w-4 h-4" />
                  Overlay
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Button
              variant="default"
              className="gap-2"
              onClick={() => setSaveDialogOpen(true)}
            >
              <Save className="w-4 h-4" />
              Save Results
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Select value={filterAsset} onValueChange={setFilterAsset}>
              <SelectTrigger className="w-40">
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
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="similarity">By Similarity</SelectItem>
                <SelectItem value="date">By Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Statistics */}
        {transactionParams && calculateStats() && (
          <div className="mb-6">
            <TradeStatistics stats={calculateStats()!} />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {viewMode === "base" && (
            <ScrollArea className="h-full">
              <div className="pb-6">
                <BaseChartCanvas
                  candles={setupCandles.length > 0 ? setupCandles : generateMockCandles(20, 100, "sideways")}
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
            <ScrollArea className="h-full">
              <div className="flex flex-col">
                <PatternDetailView
                  pattern={filteredPatterns[currentIndex]}
                  individualStats={getIndividualStats(filteredPatterns[currentIndex])}
                  transactionParams={transactionParams}
                  setupCandles={setupCandles}
                />
                <div className="flex items-center justify-between mt-6 pt-6 border-t">
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
            </ScrollArea>
          )}

          {viewMode === "overlay" && (
            <div className="h-full">
              <OverlayView
                patterns={filteredPatterns}
                setupCandles={setupCandles}
                chartType={outcomeChartType}
                onChartTypeChange={setOutcomeChartType}
                transactionParams={transactionParams}
                onTransactionParamsChange={setTransactionParams}
              />
            </div>
          )}
        </div>
      </div>

      <VirtualTransactionDialog
        open={virtualTransactionOpen}
        onOpenChange={setVirtualTransactionOpen}
        onApply={setTransactionParams}
        initialParams={transactionParams || undefined}
      />

      <SaveToLibraryDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={handleSaveToLibrary}
        collectionNames={collections.map(collection => collection.name)}
      />
 
      {/* Leave Warning Dialog */}
      <AlertDialog open={showLeaveWarning} onOpenChange={setShowLeaveWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-primary" />
              Unsaved Results
            </AlertDialogTitle>
            <AlertDialogDescription>
              Your similarity search results have not been saved. If you leave this page, they will be lost. Would you like to save them first?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelLeave}>Stay on Page</AlertDialogCancel>
            <Button variant="outline" onClick={handleConfirmLeave}>
              Leave Without Saving
            </Button>
            <AlertDialogAction onClick={() => {
              setShowLeaveWarning(false);
              setSaveDialogOpen(true);
            }}>
              Save Results
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Pattern Card Component
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

  const candles = pattern.setupCandles || generateMockCandles(15, 100, pattern.outcome === "bullish" ? "up" : pattern.outcome === "bearish" ? "down" : "sideways");

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
          <span className="text-xs text-muted-foreground">{pattern.date}</span>
        </div>
      </div>
    </Card>
  );
};

// Pattern Detail View Component
interface PatternDetailViewProps {
  pattern: SimilarPattern;
  individualStats?: IndividualTradeStats;
  transactionParams?: {
    takeProfit: number;
    stopLoss: number;
    timeHorizon: number;
    position: "long" | "short";
  } | null;
  setupCandles?: CandleData[];
}

const PatternDetailView = ({
  pattern,
  individualStats,
  transactionParams,
  setupCandles: propSetupCandles,
}: PatternDetailViewProps) => {
  const [chartType, setChartType] = useState<"candle" | "line">("candle");
  const setupCandles = pattern.setupCandles || generateMockCandles(20, 100, "sideways");
  const outcomeCandles = pattern.outcomeCandles || generateMockCandles(
    15,
    setupCandles[setupCandles.length - 1]?.close || 100,
    pattern.outcome === "bullish" ? "up" : pattern.outcome === "bearish" ? "down" : "sideways"
  );

  return (
    <div className="flex-1 flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-2xl font-bold text-foreground">{pattern.asset}</h3>
          <p className="text-muted-foreground mt-1">
            {pattern.date} • {pattern.timeframe}
          </p>
        </div>
        <Badge variant="secondary" className="bg-primary/10 text-primary text-lg px-4 py-2">
          {pattern.similarity}% Match
        </Badge>
      </div>

      {individualStats && <TradeStatistics individualStats={individualStats} />}

      <div className="flex-1">
        <DetailChartCanvas
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

// Overlay View Component
const OverlayView = ({
  patterns,
  setupCandles,
  chartType,
  onChartTypeChange,
  transactionParams,
  onTransactionParamsChange,
}: {
  patterns: SimilarPattern[];
  setupCandles: CandleData[];
  chartType: "candle" | "line";
  onChartTypeChange: (type: "candle" | "line") => void;
  transactionParams: TransactionBoxModel | null;
  onTransactionParamsChange: (params:TransactionBoxModel | null) => void;
}) => {
  const [tradeStats, setTradeStats] = useState<TradeStats | null>(null);

  const outcomesData = patterns.map((pattern) => {
    return pattern.outcomeCandles || generateMockCandles(
      15,
      setupCandles[setupCandles.length - 1]?.close || 100,
      pattern.outcome === "bullish" ? "up" : pattern.outcome === "bearish" ? "down" : "sideways"
    );
  });

  useEffect(() => {
    if (!transactionParams) {
      setTradeStats(null);
      return;
    }

    const trades = patterns.map((pattern, idx) => {
      const outcome = outcomesData[idx];
      if (!outcome || outcome.length === 0) return null;

      const entryPrice = outcome[0].open;
      const isLong = transactionParams.position === "long";
      const takeProfitPrice = entryPrice * (1 + transactionParams.takeProfit / 100 * (isLong ? 1 : -1));
      const stopLossPrice = entryPrice * (1 - transactionParams.stopLoss / 100 * (isLong ? 1 : -1));

      let result: "win" | "loss" | "timeout" = "timeout";
      let profit = 0;
      let duration = transactionParams.timeHorizon;

      for (let i = 0; i < Math.min(outcome.length, transactionParams.timeHorizon); i++) {
        const candle = outcome[i];
        if (isLong) {
          if (candle.high >= takeProfitPrice) {
            result = "win";
            profit = transactionParams.takeProfit;
            duration = i + 1;
            break;
          } else if (candle.low <= stopLossPrice) {
            result = "loss";
            profit = -transactionParams.stopLoss;
            duration = i + 1;
            break;
          }
        } else {
          if (candle.low <= takeProfitPrice) {
            result = "win";
            profit = transactionParams.takeProfit;
            duration = i + 1;
            break;
          } else if (candle.high >= stopLossPrice) {
            result = "loss";
            profit = -transactionParams.stopLoss;
            duration = i + 1;
            break;
          }
        }
      }

      if (result === "timeout") {
        const lastCandle = outcome[Math.min(outcome.length - 1, transactionParams.timeHorizon - 1)];
        profit = isLong
          ? ((lastCandle.close - entryPrice) / entryPrice) * 100
          : ((entryPrice - lastCandle.close) / entryPrice) * 100;
      }

      return { result, profit, duration };
    }).filter(t => t !== null);

    const wins = trades.filter(t => t!.result === "win").length;
    const avgProfit = trades.reduce((acc, t) => acc + t!.profit, 0) / trades.length;
    const avgDuration = trades.reduce((acc, t) => acc + t!.duration, 0) / trades.length;

    setTradeStats({
      winRate: (wins / trades.length) * 100,
      avgProfit,
      totalTrades: trades.length,
      avgDuration,
    });
  }, [transactionParams, patterns]);

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
        {transactionParams && (
          <Card className="p-6">
            <h4 className="text-lg font-semibold text-foreground mb-4">Transaction Parameters</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Position</p>
                <p className="text-lg font-semibold capitalize">{transactionParams.position}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Take Profit</p>
                <p className="text-lg font-semibold text-bullish">{transactionParams.takeProfit.toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Stop Loss</p>
                <p className="text-lg font-semibold text-bearish">{transactionParams.stopLoss.toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Time Horizon</p>
                <p className="text-lg font-semibold">{transactionParams.timeHorizon} candles</p>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-6">
          <div className="mb-4">
            <h4 className="text-lg font-semibold text-foreground mb-1">Setup Pattern + Outcome Overlays</h4>
            <p className="text-sm text-muted-foreground">
              Setup on the left, outcomes on the right. Draw a transaction box to test your strategy.
            </p>
          </div>
          <OverlayChartCanvas
            setupCandles={setupCandles}
            outcomesData={outcomesData}
            chartType={chartType}
            onTransactionBoxChange={onTransactionParamsChange}
            transactionBox={transactionParams}
          />
        </Card>

        <Card className="p-6">
          <h4 className="text-lg font-semibold text-foreground mb-4">Pattern Insights</h4>
          <p className="text-sm text-muted-foreground">
            The unified overlay shows the setup pattern (left of divider) and overlaid outcome continuations (right of divider).
          </p>
        </Card>
      </div>
    </ScrollArea>
  );
};

export default Results;
