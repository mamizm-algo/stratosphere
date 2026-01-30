import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChartCanvas } from "@/components/chart/ChartCanvas";
import { Toolbar } from "@/components/chart/Toolbar";
import { SimilaritySearchDialog, SearchConfig } from "@/components/chart/SimilaritySearchDialog";
import { useCollections } from "@/hooks/useCollections";
import { CompareToCollectionDialog } from "@/components/library/CompareToCollectionDialog";
import { toast } from "sonner";
import { searchSimilarPatterns } from "@/lib/similarityCalculator";
import { CANDLE_DATA } from "@/data/candles";
import { storeSearchResults } from "./Results";
import { HomeHeader } from "@/components/HomeHeader";

export type DrawMode = "candle" | "line" | "select";
export type Volatility = "low" | "medium" | "high";
export const MAX_CANDLES = 100;


const Chart = () => {
  const navigate = useNavigate();
  const { collections } = useCollections();
  const [drawMode, setDrawMode] = useState<DrawMode>("candle");
  const [volatility, setVolatility] = useState<Volatility>("medium");
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [searchInputCandles, setSearchInputCandles] = useState<any[]>([]);
  const [compareToCollectionOpen, setCompareToCollectionOpen] = useState(false);
  const [currentChartData, setCurrentChartData] = useState<any[]>([]);
  const [candleCount, setCandleCount] = useState(0);
  const handleClearRef = useRef<any>(null);

  const handleSearch = (config: SearchConfig) => {
    setDrawMode("select");
    const searchResults = searchSimilarPatterns(
      searchInputCandles,
      CANDLE_DATA,
      config
    );

    // Store results and navigate to results page
    storeSearchResults(searchResults, searchInputCandles);
    navigate("/results");
  };

  const handleCompareToCollection = () => {
    if (searchInputCandles && searchInputCandles.length > 0) {
      setCurrentChartData(searchInputCandles);
      setCompareToCollectionOpen(true);
    } else {
      toast.error("Please draw at least 2 candles first");
    }
  };

  const handleClear = () => {
    if (handleClearRef.current) {
      handleClearRef.current();
    }
    setDrawMode("select");
  };

  const handleSearchSimilarButton = () => {
    setSearchDialogOpen(true);
    setDrawMode("select");
  }

  const handleCandleCountChange = (count: number) => {
    setCandleCount(count);
    if (count >= MAX_CANDLES) {
      toast.error(`A maximum of ${MAX_CANDLES} candles can be drawn`);
      setDrawMode("select");
    }
  }

  const handleDrawModeChange = (drawMode: DrawMode) => {
    if (candleCount >= MAX_CANDLES) {
      toast.error(`A maximum of ${MAX_CANDLES} candles can be drawn`);
      setDrawMode("select");
    } else {
      setDrawMode(drawMode);
    }
  }

  return (
    <>
      <div className="flex flex-col h-screen bg-background">
        <HomeHeader />
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* <Toolbar 
            drawMode={drawMode} 
            setDrawMode={handleDrawModeChange}
            volatility={volatility}
            setVolatility={setVolatility}
            onSearchSimilar={handleSearchSimilarButton}
            onCompareToCollection={handleCompareToCollection}
            onClear={handleClear}
            candleCount={candleCount}
          /> */}
          <div className="flex-1 overflow-hidden p-4">
            {/* <ChartCanvas 
              drawMode={drawMode} 
              volatility={volatility}
              onCandleCountChange={handleCandleCountChange}
              onClear={(clearFn) => { handleClearRef.current = clearFn; }}
              setSearchInputCandles={setSearchInputCandles}
            /> */}
          </div>
        </div>
      </div>

      <SimilaritySearchDialog
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
        onSearch={handleSearch}
        patternLength={candleCount}
      />

      <CompareToCollectionDialog
        open={compareToCollectionOpen}
        onOpenChange={setCompareToCollectionOpen}
        collections={collections}
        chartData={currentChartData}
      />
    </>
  );
};

export default Chart;
