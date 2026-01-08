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
import { TradeStatistics, TradeStats } from "./TradeStatistics";
import { OverlayChartCanvas } from "./OverlayChartCanvas";
import { DetailChartCanvas } from "./DetailChartCanvas";
import { BaseChartCanvas } from "./BaseChartCanvas";
import { SaveToLibraryDialog } from "@/components/library/SaveToLibraryDialog";
import { useCollections } from "@/hooks/useCollections";
import { Logical } from "lightweight-charts";
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
}

export interface TransactionBoxModel {
  entryPrice: number;        // where profit & loss meet
  profitSize: number;        // height
  lossSize: number;          // height
  startLogical: Logical;     // left edge
  duration: number;             // candles
  position: "long" | "short";
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
  const [outcomeChartType, setOutcomeChartType] = useState<"candle" | "line">("candle");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [baseChartType, setBaseChartType] = useState<"candle" | "line">("candle");
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

  const uniqueAssets = Array.from(new Set(patterns.map((p) => p.asset)));

  const handleSavePattern = (pattern: SimilarPattern) => {
    onSaveToLibrary(pattern);
    toast.success(`Pattern saved to library: ${pattern.asset} - ${pattern.similarity}%`);
  };


  const handleSaveToLibrary = (name: string) => {
    addCollection(name, setupCandles, patterns);
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
        <TradeStatistics
        registerTransactionChange={registerTransactionChangester} 
        outcomes={filteredPatterns}
        />
        

        {/* Content */}
        <div className="flex-1 overflow-hidden">
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
            <ScrollArea className="h-full">
              <div className="flex flex-col">
                <PatternDetailView
                  baseChart={setupCandles}
                  pattern={filteredPatterns[currentIndex]}
                  onSave={() => handleSavePattern(filteredPatterns[currentIndex])}
                  registerTransactionChange={registerTransactionChangester}
                  transactionParams={transactionParams.current}
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
      />
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
          <span className="text-xs text-muted-foreground">{pattern.date}</span>
        </div>
      </div>
    </Card>
  );
};

interface PatternDetailViewProps {
  baseChart: CandleData[];
  pattern: SimilarPattern;
  onSave: () => void;
  registerTransactionChange: (fn: (v: TransactionBoxModel) => void) => void;
  transactionParams: TransactionBoxModel;
}

const PatternDetailView = ({
  baseChart,
  pattern,
  onSave,
  registerTransactionChange,
  transactionParams
}: PatternDetailViewProps) => {
  const [chartType, setChartType] = useState<"candle" | "line">("candle");
  const setupCandles = pattern.setupCandles;
  const outcomeCandles = pattern.outcomeCandles;

  // const [transactionParams, setTransactionParams] = useState<TransactionBoxModel | null>(null);
  //  useEffect(() => {
  //     registerTransactionChange(setTransactionParams);
  //   }, [registerTransactionChange]);

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

      <IndividualTradeStatistics 
        individualOutcome={pattern}
        transactionParams={transactionParams} />

      <div className="flex-1">
        <DetailChartCanvas
          baseChart = {baseChart}
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
