import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SimilaritySearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSearch: (config: SearchConfig) => void;
}

export interface SearchConfig {
  assets: string[];
  timeframes: string[];
  dateFrom: string;
  dateTo: string;
  timeOfDay: string;
  similarityThreshold: number;
}

const AVAILABLE_ASSETS = [
  { id: "BTC/USD", name: "Bitcoin" },
  { id: "ETH/USD", name: "Ethereum" },
  { id: "SPX", name: "S&P 500" },
  { id: "AAPL", name: "Apple" },
  { id: "TSLA", name: "Tesla" },
  { id: "GOLD", name: "Gold" },
  { id: "EUR/USD", name: "Euro/Dollar" },
  { id: "GBP/USD", name: "Pound/Dollar" },
];

const AVAILABLE_TIMEFRAMES = [
  { id: "1m", name: "1 Minute" },
  { id: "5m", name: "5 Minutes" },
  { id: "15m", name: "15 Minutes" },
  { id: "30m", name: "30 Minutes" },
  { id: "1h", name: "1 Hour" },
  { id: "4h", name: "4 Hours" },
  { id: "1d", name: "1 Day" },
];

export const SimilaritySearchDialog = ({
  open,
  onOpenChange,
  onSearch,
}: SimilaritySearchDialogProps) => {
  const [selectedAssets, setSelectedAssets] = useState<string[]>(["BTC/USD"]);
  const [selectedTimeframes, setSelectedTimeframes] = useState<string[]>(["1h"]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [timeOfDay, setTimeOfDay] = useState("");
  const [similarityThreshold, setSimilarityThreshold] = useState([70]);
  const [isSearching, setIsSearching] = useState(false);

  const handleAssetToggle = (assetId: string) => {
    setSelectedAssets((prev) =>
      prev.includes(assetId)
        ? prev.filter((id) => id !== assetId)
        : [...prev, assetId]
    );
  };

  const handleTimeframeToggle = (timeframeId: string) => {
    setSelectedTimeframes((prev) =>
      prev.includes(timeframeId)
        ? prev.filter((id) => id !== timeframeId)
        : [...prev, timeframeId]
    );
  };

  const handleSearch = () => {
    if (selectedAssets.length === 0) {
      toast.error("Please select at least one asset");
      return;
    }

    if (selectedTimeframes.length === 0) {
      toast.error("Please select at least one timeframe");
      return;
    }

    setIsSearching(true);
    const config: SearchConfig = {
      assets: selectedAssets,
      timeframes: selectedTimeframes,
      dateFrom,
      dateTo,
      timeOfDay,
      similarityThreshold: similarityThreshold[0],
    };

    // Simulate search delay
    setTimeout(() => {
      setIsSearching(false);
      onSearch(config);
      onOpenChange(false);
      toast.success("Search started! You'll be notified when results are ready.");
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Search Similar Patterns</DialogTitle>
          <DialogDescription>
            Configure your similarity search parameters to find matching patterns
            across historical data.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6 py-4">
            {/* Assets Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Assets</Label>
              <p className="text-sm text-muted-foreground">
                Select one or more assets to search
              </p>
              <div className="grid grid-cols-2 gap-3">
                {AVAILABLE_ASSETS.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
                  >
                    <Checkbox
                      id={asset.id}
                      checked={selectedAssets.includes(asset.id)}
                      onCheckedChange={() => handleAssetToggle(asset.id)}
                    />
                    <label
                      htmlFor={asset.id}
                      className="text-sm font-medium leading-none cursor-pointer flex-1"
                    >
                      {asset.name}
                      <span className="block text-xs text-muted-foreground">
                        {asset.id}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Time Frame (Candle Granularity) */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Time Frame</Label>
              <p className="text-sm text-muted-foreground">
                Select one or more timeframes to search
              </p>
              <div className="grid grid-cols-2 gap-3">
                {AVAILABLE_TIMEFRAMES.map((timeframe) => (
                  <div
                    key={timeframe.id}
                    className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
                  >
                    <Checkbox
                      id={timeframe.id}
                      checked={selectedTimeframes.includes(timeframe.id)}
                      onCheckedChange={() => handleTimeframeToggle(timeframe.id)}
                    />
                    <label
                      htmlFor={timeframe.id}
                      className="text-sm font-medium leading-none cursor-pointer flex-1"
                    >
                      {timeframe.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Date Range</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateFrom">Date From</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateTo">Date To (Optional)</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Time of Day */}
            <div className="space-y-2">
              <Label htmlFor="timeOfDay">Time of Day (Optional)</Label>
              <Input
                id="timeOfDay"
                type="time"
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value)}
                placeholder="HH:MM"
              />
              <p className="text-xs text-muted-foreground">
                Specific hour to search for patterns
              </p>
            </div>

            {/* Similarity Threshold */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">
                  Minimum Similarity Threshold
                </Label>
                <span className="text-lg font-bold text-primary">
                  {similarityThreshold[0]}%
                </span>
              </div>
              <Slider
                value={similarityThreshold}
                onValueChange={setSimilarityThreshold}
                min={0}
                max={100}
                step={5}
                className="py-4"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Less strict (more results)</span>
                <span>More strict (fewer results)</span>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSearch} disabled={isSearching} className="gap-2">
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Search Similar Patterns
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
