import { useState, useEffect } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import { MockChartDisplay, generateMockCandles, CandleData } from "./MockChartDisplay";
import { VirtualTransactionDialog, VirtualTransactionParams } from "./VirtualTransactionDialog";
import { TradeStatistics, TradeStats, IndividualTradeStats } from "./TradeStatistics";
import { OverlayChartCanvas } from "./OverlayChartCanvas";
import { DetailChartCanvas } from "./DetailChartCanvas";
import { BaseChartCanvas } from "./BaseChartCanvas";
import { SaveToLibraryDialog } from "@/components/library/SaveToLibraryDialog";
import { useCollections } from "@/hooks/useCollections";

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
}

export const SimilarityResults = ({
  patterns,
  onClose,
  onSaveToLibrary,
  setupCandles,
  onSaveAsCollection,
}: SimilarityResultsProps) => {
  const { addCollection } = useCollections();
  const [viewMode, setViewMode] = useState<"base" | "grid" | "detail" | "overlay">("grid");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sortBy, setSortBy] = useState<"similarity" | "date">("similarity");
  const [filterAsset, setFilterAsset] = useState<string>("all");
  const [virtualTransactionOpen, setVirtualTransactionOpen] = useState(false);
  const [virtualParams, setVirtualParams] = useState<VirtualTransactionParams | null>(null);
  const [outcomeChartType, setOutcomeChartType] = useState<"candle" | "line">("candle");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [baseChartType, setBaseChartType] = useState<"candle" | "line">("candle");
  const [transactionParams, setTransactionParams] = useState<{
    entry: number;
    takeProfit: number;
    stopLoss: number;
    timeHorizon: number;
    position: "long" | "short";
  } | null>(null);

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

  const handleSavePattern = (pattern: SimilarPattern) => {
    onSaveToLibrary(pattern);
    toast.success(`Pattern saved to library: ${pattern.asset} - ${pattern.similarity}%`);
  };

  const handleApplyVirtualTransaction = (params: VirtualTransactionParams) => {
    setVirtualParams(params);
    const entry = transactionParams?.entry || setupCandles?.[setupCandles.length - 1]?.close || 100;
    setTransactionParams({ ...params, entry });
    toast.success("Virtual transaction parameters applied");
  };

  // Calculate statistics based on virtual transaction
  const calculateStats = (): TradeStats | null => {
    if (!transactionParams) {
      return null;
    }

    const outcomesData = filteredPatterns.slice(0, 10).map((pattern) => {
      return pattern.outcomeCandles || generateMockCandles(
        15,
        setupCandles?.[setupCandles.length - 1]?.close || 100,
        pattern.outcome === "bullish" ? "up" : pattern.outcome === "bearish" ? "down" : "sideways"
      );
    });

    const trades = outcomesData.map((outcome) => {
      if (!outcome || outcome.length === 0) return null;

      const entryPrice = transactionParams.entry;
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

    const entryPrice = transactionParams.entry;
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
    addCollection(name, setupCandles || generateMockCandles(20, 100, "sideways"), patterns);
    toast.success(`Collection "${name}" saved to library`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto h-full flex flex-col py-6">
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
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
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
              variant="outline"
              className="gap-2"
              onClick={() => setVirtualTransactionOpen(true)}
            >
              <Settings className="w-4 h-4" />
              Virtual Transaction
            </Button>

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
                  candles={setupCandles || generateMockCandles(20, 100, "sideways")}
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
                    onSave={() => handleSavePattern(pattern)}
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
                  onSave={() => handleSavePattern(filteredPatterns[currentIndex])}
                  individualStats={getIndividualStats(filteredPatterns[currentIndex])}
                  transactionParams={transactionParams}
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
                setupCandles={setupCandles || generateMockCandles(20, 100, "sideways")}
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
        onApply={handleApplyVirtualTransaction}
        initialParams={virtualParams || undefined}
      />

      <SaveToLibraryDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={handleSaveToLibrary}
      />
    </div>
  );
};

const PatternCard = ({
  pattern,
  onSave,
  onClick,
}: {
  pattern: SimilarPattern;
  onSave: () => void;
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
        <Button
          size="sm"
          variant="ghost"
          onClick={onSave}
          className="opacity-0 group-hover:opacity-100 transition-opacity gap-2"
        >
          <BookmarkPlus className="w-4 h-4" />
          Save
        </Button>
      </div>
    </Card>
  );
};

interface PatternDetailViewProps {
  pattern: SimilarPattern;
  onSave: () => void;
  individualStats?: IndividualTradeStats;
  transactionParams?: {
    entry: number;
    takeProfit: number;
    stopLoss: number;
    timeHorizon: number;
    position: "long" | "short";
  } | null;
}

const PatternDetailView = ({
  pattern,
  onSave,
  individualStats,
  transactionParams,
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

      {individualStats && <TradeStatistics stats={{ winRate: 0, avgProfit: 0, totalTrades: 0 }} individualStats={individualStats} />}

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
  transactionParams: {
    entry: number;
    takeProfit: number;
    stopLoss: number;
    timeHorizon: number;
    position: "long" | "short";
  } | null;
  onTransactionParamsChange: (params: {
    entry: number;
    takeProfit: number;
    stopLoss: number;
    timeHorizon: number;
    position: "long" | "short";
  } | null) => void;
}) => {
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [tradeStats, setTradeStats] = useState<TradeStats | null>(null);

  // Prepare outcomes data
  const outcomesData = patterns.slice(0, 10).map((pattern) => {
    return pattern.outcomeCandles || generateMockCandles(
      15,
      setupCandles[setupCandles.length - 1]?.close || 100,
      pattern.outcome === "bullish" ? "up" : pattern.outcome === "bearish" ? "down" : "sideways"
    );
  });

  // Calculate statistics when transaction params change
  useEffect(() => {
    if (!transactionParams) {
      setTradeStats(null);
      return;
    }

    // Mock calculation - simulate trade outcomes
    const trades = patterns.slice(0, 10).map((pattern, idx) => {
      const outcome = outcomesData[idx];
      if (!outcome || outcome.length === 0) return null;

      const entryPrice = transactionParams.entry;
      const isLong = transactionParams.position === "long";
      const takeProfitPrice = entryPrice * (1 + transactionParams.takeProfit / 100 * (isLong ? 1 : -1));
      const stopLossPrice = entryPrice * (1 - transactionParams.stopLoss / 100 * (isLong ? 1 : -1));

      // Simulate: check if price hits TP or SL
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
            onEditTransaction={() => setShowTransactionDialog(true)}
            initialTransactionBox={transactionParams}
          />
        </Card>

        {transactionParams && (
          <>
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

            {tradeStats && (
              <Card className="p-6">
                <h4 className="text-lg font-semibold text-foreground mb-4">Simulated Trade Results</h4>
                <TradeStatistics stats={tradeStats} />
              </Card>
            )}
          </>
        )}

        <Card className="p-6">
          <h4 className="text-lg font-semibold text-foreground mb-4">Pattern Insights</h4>
          <p className="text-sm text-muted-foreground">
            The unified overlay shows the setup pattern (left of divider) and overlaid outcome continuations (right of divider).
            Denser overlapping areas indicate more frequent price action. Draw a transaction box to simulate trade outcomes.
          </p>
        </Card>
      </div>

      <VirtualTransactionDialog
        open={showTransactionDialog}
        onOpenChange={setShowTransactionDialog}
        onApply={(params) => {
          // Add entry price from the last candle of setup or keep existing
          const entry = transactionParams?.entry || setupCandles[setupCandles.length - 1]?.close || 100;
          onTransactionParamsChange({ ...params, entry });
        }}
        initialParams={transactionParams ? {
          takeProfit: transactionParams.takeProfit,
          stopLoss: transactionParams.stopLoss,
          timeHorizon: transactionParams.timeHorizon,
          position: transactionParams.position,
        } : undefined}
      />
    </ScrollArea>
  );
};
