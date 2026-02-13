import { useState, useEffect, useCallback, useRef } from "react";
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
  FileSearch,
  Target,
  Clock,
  Hourglass,
  MessageCircleQuestion,
} from "lucide-react";
import { toast } from "sonner";
import { MockChartDisplay, generateMockCandles, CandleData } from "@/components/chart/MockChartDisplay";
import { OverlayChartCanvas } from "@/components/chart/OverlayChartCanvas";
import { DetailChartCanvas } from "@/components/chart/DetailChartCanvas";
import { BaseChartCanvas } from "@/components/chart/BaseChartCanvas";
import { SaveToLibraryDialog } from "@/components/library/SaveToLibraryDialog";
import { useCollections } from "@/hooks/useCollections";
import { HomeHeader } from "@/components/HomeHeader";
import { TransactionBoxModel } from "@/components/chart/SimilarityResults";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TradeStatisticsResults } from "@/components/chart/TradeStatisticsResults";

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

export interface TradeStats {
  tradesWon: number;
  tradesLost: number;
  winRate: number;
  avgProfit: number;
  totalProfit: number;
  totalTrades: number;
  avgDuration?: number;
  tradesTimedOut: number;
}

export interface IndividualTradeStats {
  profit: number;
  similarity: number;
  asset: string;
  timeframe: string;
  date: string;
  outcome: "win" | "loss" | "timeout";
}

// Helper functions
export const storeSearchResults = (patterns: SimilarPattern[], setupCandles: CandleData[]) => {
  sessionStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify(patterns));
  sessionStorage.setItem(SETUP_CANDLES_STORAGE_KEY, JSON.stringify(setupCandles));
};

export const clearSearchResults = () => {
  sessionStorage.removeItem(RESULTS_STORAGE_KEY);
  sessionStorage.removeItem(SETUP_CANDLES_STORAGE_KEY);
};

const normalize = (price: number, min: number, max: number) => {
  return (price - min) / (max - min) + 100;
};

const Results = () => {
  const navigate = useNavigate();
  const { collections, addCollection } = useCollections();
  const [patterns, setPatterns] = useState<SimilarPattern[]>([]);
  const [filteredPatterns, setFilteredPatterns] = useState<SimilarPattern[]>([]);
  const [setupCandles, setSetupCandles] = useState<CandleData[]>([]);
  const [normalizedSetupCandles, setNormalizedSetupCandles] = useState<CandleData[]>([]);
  const [normalizedPatterns, setNormalizedPatterns] = useState<SimilarPattern[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const [viewMode, setViewMode] = useState<"base" | "grid" | "detail" | "overlay">("grid");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sortBy, setSortBy] = useState<"similarity" | "date">("similarity");
  const [filterAsset, setFilterAsset] = useState<string>("all");
  const [outcomeChartType, setOutcomeChartType] = useState<"candle" | "line">("candle");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [baseChartType, setBaseChartType] = useState<"candle" | "line">("candle");
  const transactionParamsRef = useRef<TransactionBoxModel | null>(null);

  const setTransactionParams = (newTransactionParams: TransactionBoxModel) => {
    transactionParamsRef.current = newTransactionParams;
  }
  const settersRef = useRef<Array<(v: TransactionBoxModel) => void>>([setTransactionParams]);
  
  const transactionParams = transactionParamsRef.current;

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

   useEffect(() => {
    const filtered =  filterAsset === "all"
        ? sortedPatterns
        : sortedPatterns.filter((p) => p.asset === filterAsset)

    setFilteredPatterns(filtered);
    // Prepare outcomes data
    setNormalizedPatterns(filtered.map((pattern) => {
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
    }));
  }, [patterns]);

  useEffect(() => {
    if (setupCandles.length > 0) {
      const setupMin = Math.min(...setupCandles.map(candle => candle.low));
      const setupMax = Math.max(...setupCandles.map(candle => candle.high));
      const lastIndex = setupCandles.length - 1;
      const baseChartOffset = 100 - normalize(setupCandles[lastIndex].close, setupMin, setupMax);

    setNormalizedSetupCandles(setupCandles.map(setup => { 
      return { ...setup,
        open: normalize(setup.open, setupMin, setupMax) + baseChartOffset,
        high: normalize(setup.high, setupMin, setupMax) + baseChartOffset,
        low: normalize(setup.low, setupMin, setupMax) + baseChartOffset,
        close: normalize(setup.close, setupMin, setupMax) + baseChartOffset,
      }
      }));
    }
  }, [setupCandles]);

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

  const registerTransactionChangester = (fn: (v: TransactionBoxModel) => void) => {
    settersRef.current.push(fn);
  };

  const onTransactionParamsChange = (val: TransactionBoxModel) => {
    settersRef.current.forEach((fn) => fn(val));
  };


  const sortedPatterns = [...patterns].sort((a, b) => {
    if (sortBy === "similarity") {
      return b.similarity - a.similarity;
    }
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });


  const uniqueAssets = Array.from(new Set(patterns.map((p) => p.asset)));

  // Calculate overall statistics
  const calculateStats = (): TradeStats | null => {
    const transactionParams = transactionParamsRef.current;
    if (!transactionParams || filteredPatterns.length === 0) return null;

    const trades = filteredPatterns.map((pattern) => {
      const outcomeCandles = pattern.outcomeCandles;
      const setupCandlesArr = pattern.setupCandles;
      if (!outcomeCandles || outcomeCandles.length === 0 || !setupCandlesArr) return null;

      const entryPrice = outcomeCandles[0].open;
      const isLong = transactionParams.position === "long";

      const setupMin = Math.min(...setupCandlesArr.map((c) => c.low));
      const setupMax = Math.max(...setupCandlesArr.map((c) => c.high));
      const lastIndex = setupCandlesArr.length - 1;
      const setupOffset = 100 - normalize(setupCandlesArr[lastIndex].close, setupMin, setupMax);

      const normalizedProfitPrice = transactionParams.entryPrice + transactionParams.profitSize;
      const offsetProfitPrice = normalizedProfitPrice - setupOffset;
      const takeProfitPrice = (offsetProfitPrice - 100) * (setupMax - setupMin) + setupMin;
      const profitSize = Math.abs(takeProfitPrice - entryPrice) / entryPrice * 100;

      const normalizedLossPrice = transactionParams.entryPrice + transactionParams.lossSize;
      const offsetLossPrice = normalizedLossPrice - setupOffset;
      const stopLossPrice = (offsetLossPrice - 100) * (setupMax - setupMin) + setupMin;
      const lossSize = Math.abs(stopLossPrice - entryPrice) / entryPrice * 100;

      let result: "win" | "loss" | "timeout" = "timeout";
      let profit = 0;
      let duration = transactionParams.duration;

      for (let i = 0; i < Math.min(outcomeCandles.length, transactionParams.duration); i++) {
        const candle = outcomeCandles[i];
        if (isLong) {
          if (candle.high >= takeProfitPrice) {
            result = "win";
            profit = profitSize;
            duration = i + 1;
            break;
          } else if (candle.low <= stopLossPrice) {
            result = "loss";
            profit = -lossSize;
            duration = i + 1;
            break;
          }
        } else {
          if (candle.low <= takeProfitPrice) {
            result = "win";
            profit = profitSize;
            duration = i + 1;
            break;
          } else if (candle.high >= stopLossPrice) {
            result = "loss";
            profit = -lossSize;
            duration = i + 1;
            break;
          }
        }
      }

      if (result === "timeout") {
        const lastCandle = outcomeCandles[Math.min(outcomeCandles.length - 1, transactionParams.duration - 1)];
        profit = isLong
          ? ((lastCandle.close - entryPrice) / entryPrice) * 100
          : ((entryPrice - lastCandle.close) / entryPrice) * 100;
      }

      return { result, profit, duration };
    }).filter((t) => t !== null);

    if (trades.length === 0) return null;

    const wins = trades.filter((t) => t!.result === "win").length;
    const tradesTimedOut = trades.filter((t) => t!.result === "timeout").length;
    const avgProfit = trades.reduce((acc, t) => acc + t!.profit, 0) / trades.length;
    const avgDuration = trades.reduce((acc, t) => acc + t!.duration, 0) / trades.length;
    const totalProfit = trades.reduce((acc, t) => acc + t!.profit, 0);

    return {
      tradesWon: wins,
      tradesLost: trades.length - wins - tradesTimedOut,
      winRate: (wins / trades.length) * 100,
      avgProfit,
      totalProfit,
      totalTrades: trades.length,
      avgDuration,
      tradesTimedOut,
    };
  };

  // Calculate individual stats for a pattern
  const getIndividualStats = (pattern: SimilarPattern): IndividualTradeStats | null => {
    if (!transactionParams) return null;

    const outcomeCandles = pattern.outcomeCandles || generateMockCandles(
      15,
      setupCandles?.[setupCandles.length - 1]?.close || 100,
      pattern.outcome === "bullish" ? "up" : pattern.outcome === "bearish" ? "down" : "sideways"
    );
    
    const setupCandlesArr = pattern.setupCandles || setupCandles;
    if (!setupCandlesArr || setupCandlesArr.length === 0) return null;

    const entryPrice = outcomeCandles[0].open;
    const isLong = transactionParams.position === "long";

    const setupMin = Math.min(...setupCandlesArr.map((c) => c.low));
    const setupMax = Math.max(...setupCandlesArr.map((c) => c.high));
    const lastIndex = setupCandlesArr.length - 1;
    const setupOffset = 100 - normalize(setupCandlesArr[lastIndex].close, setupMin, setupMax);

    const normalizedProfitPrice = transactionParams.entryPrice + transactionParams.profitSize;
    const offsetProfitPrice = normalizedProfitPrice - setupOffset;
    const takeProfitPrice = (offsetProfitPrice - 100) * (setupMax - setupMin) + setupMin;
    const profitSize = Math.abs(takeProfitPrice - entryPrice) / entryPrice * 100;

    const normalizedLossPrice = transactionParams.entryPrice + transactionParams.lossSize;
    const offsetLossPrice = normalizedLossPrice - setupOffset;
    const stopLossPrice = (offsetLossPrice - 100) * (setupMax - setupMin) + setupMin;
    const lossSize = Math.abs(stopLossPrice - entryPrice) / entryPrice * 100;

    let result: "win" | "loss" | "timeout" = "timeout";
    let profit = 0;
    let duration = transactionParams.duration;

    for (let i = 0; i < Math.min(outcomeCandles.length, transactionParams.duration); i++) {
      const candle = outcomeCandles[i];
      if (isLong) {
        if (candle.high >= takeProfitPrice) {
          result = "win";
          profit = profitSize;
          duration = i + 1;
          break;
        } else if (candle.low <= stopLossPrice) {
          result = "loss";
          profit = -lossSize;
          duration = i + 1;
          break;
        }
      } else {
        if (candle.low <= takeProfitPrice) {
          result = "win";
          profit = profitSize;
          duration = i + 1;
          break;
        } else if (candle.high >= stopLossPrice) {
          result = "loss";
          profit = -lossSize;
          duration = i + 1;
          break;
        }
      }
    }

    if (result === "timeout") {
      const lastCandle = outcomeCandles[Math.min(outcomeCandles.length - 1, transactionParams.duration - 1)];
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
    try {
      addCollection(name, setupCandles, patterns);
    } catch (e) {
      toast.error(`We couldn't save your collection. Try removing some old collections first.`);
      return;
    }
    setIsSaved(true);
    clearSearchResults();
    toast.success(`Collection "${name}" saved to library`);
  };

  const stats = calculateStats();

  // Empty state
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
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <HomeHeader />

      <div className="flex-1 flex flex-col px-4 lg:px-6 py-4 overflow-hidden">
        {/* Header - Compact */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          {/* Left: Title and Navigation */}
          <div className="flex items-center gap-4 min-w-0 flex-1">
           
              <div className="flex-shrink-0">
                <h2 className="text-2xl font-bold text-foreground">
                  Similar Patterns Found
                </h2>
                <p className="text-sm text-muted-foreground">
                  {filteredPatterns.length} matches across {uniqueAssets.length} assets
                </p>
              </div>
            

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
          </div>

           <Button
              variant="default"
              size="sm"
              className="gap-1.5"
              onClick={() => setSaveDialogOpen(true)}
            >
              <Save className="w-3.5 h-3.5" />
              Save
            </Button>

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
          </div>
        </div>
      

        {/* Main Content Area - Full height, no scroll on outer container */}
        <div className="flex-1 min-h-0">
          {/* BASE CHART VIEW - Full width */}
          {viewMode === "base" && (
            <div className="h-full">
              <BaseChartCanvas
                candles={setupCandles}
                chartType={baseChartType}
                onChartTypeChange={setBaseChartType}
              />
            </div>
          )}

          {/* GRID VIEW - Full width with scrollable grid */}
          {viewMode === "grid" && (
            <ScrollArea className="h-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pb-4">
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

          {/* DETAIL VIEW - Chart on left, stats on right (desktop), stacked (mobile) */}
          {viewMode === "detail" && filteredPatterns.length > 0 && (
            <div className="h-full flex flex-col lg:flex-row gap-4">
              {/* Chart area - takes most space */}
              <div className="flex-1 min-w-0 flex flex-col min-h-0">
                <PatternDetailView
                  pattern={filteredPatterns[currentIndex]}
                  setupCandles={setupCandles}
                  transactionParams={transactionParams}
                />
                
                {/* Navigation - bottom of chart area */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                    disabled={currentIndex === 0}
                    className="gap-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {currentIndex + 1} of {filteredPatterns.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentIndex(Math.min(filteredPatterns.length - 1, currentIndex + 1))}
                    disabled={currentIndex === filteredPatterns.length - 1}
                    className="gap-1.5"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Stats sidebar - fixed width on desktop, full width on mobile */}
              {transactionParams && (
                <div className="w-full lg:w-72 xl:w-80 shrink-0 flex flex-col gap-3 lg:overflow-y-auto">
                  {/* Overall Stats - Compact */}
                  {stats && (
                    <Card className="p-3">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Overall Stats</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <StatItem 
                          icon={<Target className="w-3.5 h-3.5 text-primary" />}
                          label="Win Rate"
                          value={`${stats.winRate.toFixed(1)}%`}
                          tooltip={`${stats.tradesWon} wins / ${stats.totalTrades} trades`}
                        />
                        <StatItem 
                          icon={<TrendingUp className="w-3.5 h-3.5 text-primary" />}
                          label="Total"
                          value={String(stats.totalTrades)}
                        />
                        <StatItem 
                          icon={stats.avgProfit >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-bullish" /> : <TrendingDown className="w-3.5 h-3.5 text-bearish" />}
                          label="Avg Result"
                          value={`${stats.avgProfit >= 0 ? "+" : ""}${stats.avgProfit.toFixed(2)}%`}
                          valueClass={stats.avgProfit >= 0 ? "text-bullish" : "text-bearish"}
                        />
                        <StatItem 
                          icon={stats.totalProfit >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-bullish" /> : <TrendingDown className="w-3.5 h-3.5 text-bearish" />}
                          label="Total P/L"
                          value={`${stats.totalProfit >= 0 ? "+" : ""}${stats.totalProfit.toFixed(2)}%`}
                          valueClass={stats.totalProfit >= 0 ? "text-bullish" : "text-bearish"}
                        />
                        <StatItem 
                          icon={<Clock className="w-3.5 h-3.5 text-primary" />}
                          label="Avg Duration"
                          value={`${stats.avgDuration?.toFixed(1) || 0} bars`}
                        />
                        <StatItem 
                          icon={<Hourglass className="w-3.5 h-3.5 text-muted-foreground" />}
                          label="Timeouts"
                          value={String(stats.tradesTimedOut)}
                        />
                      </div>
                    </Card>
                  )}

                  {/* Individual Trade Stats */}
                  {(() => {
                    const indStats = getIndividualStats(filteredPatterns[currentIndex]);
                    if (!indStats) return null;
                    return (
                      <Card className="p-3">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">This Trade</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="col-span-2">
                            <p className="text-[10px] text-muted-foreground uppercase">Result</p>
                            <p className={`text-xl font-bold ${indStats.profit >= 0 ? "text-bullish" : "text-bearish"}`}>
                              {indStats.profit >= 0 ? "+" : ""}{indStats.profit.toFixed(2)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase">Outcome</p>
                            <p className={`text-sm font-semibold ${
                              indStats.outcome === "win" ? "text-bullish" : 
                              indStats.outcome === "loss" ? "text-bearish" : 
                              "text-muted-foreground"
                            }`}>
                              {indStats.outcome.toUpperCase()}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase">Similarity</p>
                            <p className="text-sm font-semibold text-primary">{indStats.similarity}%</p>
                          </div>
                        </div>
                      </Card>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* OVERLAY VIEW - Chart with side panel for stats */}
          {viewMode === "overlay" && (
            <div className="h-full flex flex-col lg:flex-row gap-4">
              {/* Main chart area */}
              <div className="flex-1 min-w-0 min-h-0 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-foreground">Overlay Analysis</h3>
                  <Select value={outcomeChartType} onValueChange={(v) => setOutcomeChartType(v as "candle" | "line")}>
                    <SelectTrigger className="w-28 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="candle">Candles</SelectItem>
                      <SelectItem value="line">Line</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Card className="flex-1 p-4 min-h-0">
                  <OverlayChartCanvas
                    setupCandles={normalizedSetupCandles}
                    outcomesData={normalizedPatterns.map((pattern) => {
                      return pattern.outcomeCandles;
                    })}
                    chartType={outcomeChartType}
                    onTransactionBoxChange={onTransactionParamsChange}
                    initialTransactionParams={transactionParams}
                  />
                </Card>
              </div>

              {/* Stats sidebar */}
              {/* Statistics */}
              <TradeStatisticsResults
              registerTransactionChange={registerTransactionChangester} 
              // outcomes={normalizedPatterns}
              outcomes={filteredPatterns}
              />
            </div>
          )}
        </div>
      </div>

      <SaveToLibraryDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={handleSaveToLibrary}
        collectionNames={collections.map((c) => c.name)}
      />

      <AlertDialog open={showLeaveWarning} onOpenChange={setShowLeaveWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-primary" />
              Unsaved Results
            </AlertDialogTitle>
            <AlertDialogDescription>
              Your similarity search results have not been saved. If you leave this page, they will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelLeave}>Stay</AlertDialogCancel>
            <Button variant="outline" onClick={handleConfirmLeave}>Leave</Button>
            <AlertDialogAction onClick={() => { setShowLeaveWarning(false); setSaveDialogOpen(true); }}>
              Save Results
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Compact stat item component
export const StatItem = ({ 
  icon, 
  label, 
  value, 
  valueClass = "text-foreground",
  tooltip 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  valueClass?: string;
  tooltip?: string;
}) => (
  <div className="flex items-start gap-1.5">
    <div className="mt-0.5">{icon}</div>
    <div className="min-w-0">
      <div className="flex items-center gap-1">
        <p className="text-[10px] text-muted-foreground uppercase truncate">{label}</p>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <MessageCircleQuestion className="w-3 h-3 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent><p className="text-xs">{tooltip}</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <p className={`text-sm font-bold ${valueClass}`}>{value}</p>
    </div>
  </div>
);

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

      <div className="flex items-center justify-between mt-2">
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
  setupCandles: CandleData[];
  transactionParams: TransactionBoxModel | null;
}

const PatternDetailView = ({
  pattern,
  setupCandles: baseSetupCandles,
  transactionParams,
}: PatternDetailViewProps) => {
  const [chartType, setChartType] = useState<"candle" | "line">("candle");
  const setupCandles = pattern.setupCandles;
  const outcomeCandles = pattern.outcomeCandles;

  // Normalize base chart for overlay
  const setupMin = Math.min(...setupCandles.map((c) => c.low));
  const setupMax = Math.max(...setupCandles.map((c) => c.high));
  const baseMin = normalize(Math.min(...baseSetupCandles.map((c) => c.low)), setupMin, setupMax);
  const baseMax = normalize(Math.max(...baseSetupCandles.map((c) => c.high)), setupMin, setupMax);
  const baseCandles = baseSetupCandles.map((c) => ({
    ...c,
    open: normalize(c.open, baseMin, baseMax),
    high: normalize(c.high, baseMin, baseMax),
    low: normalize(c.low, baseMin, baseMax),
    close: normalize(c.close, baseMin, baseMax),
  }));

  return (
    <div className="flex-1 flex flex-col gap-2 min-h-0">
      <div className="flex items-start justify-between">
         <div>
          <p className="text-muted-foreground mt-1">
            {pattern.asset} • {new Date(pattern.date).toLocaleDateString()} • {pattern.timeframe}
          </p>
        </div>
        <Badge variant="secondary" className="bg-primary/10 text-primary text-base px-3 py-1">
          {pattern.similarity}% Match
        </Badge>
      </div>

      <div className="flex-1 min-h-0">
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

export default Results;
