import { useState, useRef } from "react";
import { generateMockCandles } from "@/components/chart/MockChartDisplay";
import { ChartCanvas } from "@/components/chart/ChartCanvas";
import { Toolbar } from "@/components/chart/Toolbar";
import { ChartHeader } from "@/components/chart/ChartHeader";
import { SimilaritySearchDialog, SearchConfig } from "@/components/chart/SimilaritySearchDialog";
import { SimilarityResults, SimilarPattern } from "@/components/chart/SimilarityResults";
import { useNavigate } from "react-router-dom";
import { useCollections } from "@/hooks/useCollections";
import { CompareToCollectionDialog } from "@/components/library/CompareToCollectionDialog";
import { VirtualTransactionDialog, VirtualTransactionParams } from "@/components/chart/VirtualTransactionDialog";
import { toast } from "sonner";
import { calculateSimilarityScore, searchSimilarPatterns } from "@/lib/similarityCalculator";
import { CANDLE_DATA } from "@/data/candles";

export type DrawMode = "candle" | "line" | "horizontal" | "vertical" | "angled" | "select";
export type Volatility = "low" | "medium" | "high";

const Chart = () => {
  const navigate = useNavigate();
  const { addCollection, collections } = useCollections();
  const [drawMode, setDrawMode] = useState<DrawMode>("candle");
  const [volatility, setVolatility] = useState<Volatility>("medium");
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState<SimilarPattern[]>([]);
  const [searchInputCandles, setSearchInputCandles] = useState<any[]>([]);
  const [savedPatterns, setSavedPatterns] = useState<SimilarPattern[]>([]);
  const [compareToCollectionOpen, setCompareToCollectionOpen] = useState(false);
  const [currentChartData, setCurrentChartData] = useState<any[]>([]);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [candleCount, setCandleCount] = useState(0);
  const handleClearRef = useRef<any>(null);

  const handleSearch = (config: SearchConfig) => {
    setSearchInputCandles(searchInputCandles);
    const searchResults = searchSimilarPatterns(
          searchInputCandles,
          CANDLE_DATA,
          config
        );

    setSearchResults(searchResults);
    setShowResults(true);
  };

  const handleSaveToLibrary = (pattern: SimilarPattern) => {
    setSavedPatterns((prev) => [...prev, pattern]);
    toast.success("Pattern saved to library");
  };

  const handleSaveAsCollection = (name: string) => {
    addCollection(name, searchInputCandles, searchResults);
    toast.success(`Collection "${name}" saved to library!`);
    setShowResults(false);
  };

  const handleCompareToCollection = () => {
    // Get the current drawn candles from the search input or generate mock data
    const drawnCandles = searchInputCandles.length > 0 ? searchInputCandles : generateMockCandles(20, 100, "sideways");
    if (drawnCandles && drawnCandles.length > 0) {
      setCurrentChartData(drawnCandles);
      setCompareToCollectionOpen(true);
    } else {
      toast.error("Please draw at least 2 candles first");
    }
  };

  const handleClear = () => {
    // Call the clear handler if available
    if (handleClearRef.current) {
      handleClearRef.current();
    }
  };

  const handleVirtualTransaction = (params: VirtualTransactionParams) => {
    console.log("Virtual transaction:", params);
    toast.success("Virtual transaction executed");
  };

  return (
    <>
      <div className="flex flex-col h-screen bg-background">
        <ChartHeader />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Toolbar 
            drawMode={drawMode} 
            setDrawMode={setDrawMode}
            volatility={volatility}
            setVolatility={setVolatility}
            onSearchSimilar={() => setSearchDialogOpen(true)}
            onCompareToCollection={handleCompareToCollection}
            onClear={handleClear}
            candleCount={candleCount}
          />
          <div className="flex-1 overflow-hidden p-4">
            <ChartCanvas 
              drawMode={drawMode} 
              volatility={volatility}
              onCandleCountChange={setCandleCount}
              onClear={(clearFn) => { handleClearRef.current = clearFn; }}
              setSearchInputCandles={setSearchInputCandles}
            />
          </div>
        </div>
      </div>

      <SimilaritySearchDialog
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
        onSearch={handleSearch}
      />

      {showResults && (
        <SimilarityResults
          patterns={searchResults}
          onClose={() => setShowResults(false)}
          onSaveToLibrary={handleSaveToLibrary}
          setupCandles={searchInputCandles}
          onSaveAsCollection={handleSaveAsCollection}
        />
      )}

      <CompareToCollectionDialog
        open={compareToCollectionOpen}
        onOpenChange={setCompareToCollectionOpen}
        collections={collections}
        chartData={currentChartData}
      />

      <VirtualTransactionDialog
        open={transactionDialogOpen}
        onOpenChange={setTransactionDialogOpen}
        onApply={handleVirtualTransaction}
      />
    </>
  );
};

export default Chart;
