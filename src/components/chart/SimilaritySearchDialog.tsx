import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Loader2, Clock, Globe } from "lucide-react";
import { toast } from "sonner";
import { AssetSearchInput } from "@/components/chart/AssetSearchInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CANDLE_DATA } from "@/data/candles";

const TIMEZONES = [
  { id: "UTC", name: "UTC", offset: "+00:00" },
  { id: "America/New_York", name: "New York", offset: "-05:00" },
  { id: "America/Chicago", name: "Chicago", offset: "-06:00" },
  { id: "America/Los_Angeles", name: "Los Angeles", offset: "-08:00" },
  { id: "Europe/London", name: "London", offset: "+00:00" },
  { id: "Europe/Paris", name: "Paris", offset: "+01:00" },
  { id: "Europe/Berlin", name: "Berlin", offset: "+01:00" },
  { id: "Asia/Tokyo", name: "Tokyo", offset: "+09:00" },
  { id: "Asia/Shanghai", name: "Shanghai", offset: "+08:00" },
  { id: "Asia/Singapore", name: "Singapore", offset: "+08:00" },
  { id: "Australia/Sydney", name: "Sydney", offset: "+11:00" },
];

const TIME_PRESETS = [
  { id: "market-open-us", label: "US Market Open (stocks)", time: "09:30", timezone: "America/New_York", icon: "🌎" },
  { id: "market-open-us-stocks", label: "US Market Open (forex)", time: "08:00", timezone: "America/New_York", icon: "🌎" },
  { id: "london-open", label: "London Open", time: "08:00", timezone: "Europe/London", icon: "🌍" },
  { id: "asian-session", label: "Asian Session", time: "00:00", timezone: "Asia/Tokyo", icon: "🌏" },
];

interface SimilaritySearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSearch: (config: SearchConfig) => void;
  patternLength: number;
}

export interface SearchConfig {
  assets: string[];
  timeframes: string[];
  dateFrom: string;
  dateTo: string;
  timeOfDay: string;
  timezoneOffset: string;
  similarityThreshold: number;
}

const AVAILABLE_ASSETS = [
  { id: "GOLD", name: "Gold" }
];

const AVAILABLE_TIMEFRAMES = [
  { id: "1m", name: "1 Minute", candlesPerDay: 1440 },
  // { id: "5m", name: "5 Minutes", candlesPerDay: 288 },
  // { id: "15m", name: "15 Minutes", candlesPerDay: 96 },
  // { id: "30m", name: "30 Minutes", candlesPerDay: 48 },
  // { id: "1h", name: "1 Hour", candlesPerDay: 24 },
  // { id: "4h", name: "4 Hours", candlesPerDay: 6 },
  // { id: "1d", name: "1 Day", candlesPerDay: 1 },
];

export const SimilaritySearchDialog = ({
  open,
  onOpenChange,
  onSearch,
  patternLength
}: SimilaritySearchDialogProps) => {
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [selectedTimeframes, setSelectedTimeframes] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [timeOfDay, setTimeOfDay] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [similarityThreshold, setSimilarityThreshold] = useState([70]);
  const [isSearching, setIsSearching] = useState(false);

  
  const calculateEstimatedTime = () => {
    if (selectedAssets.length > 0 && selectedTimeframes.length > 0) {
      const maxPatternLength = 100;
      const assetTimeframes = selectedAssets.flatMap(asset => selectedTimeframes.map(tf => `${asset}_${tf}`));
      let dataLength = assetTimeframes.map(asset => CANDLE_DATA[asset].length).reduce((a,b) => a+b, 0);
      if (timeOfDay) {
        for (const timeframe of selectedTimeframes) {
          const timeframeCandlesPerDay = AVAILABLE_TIMEFRAMES.find(avail_tf => avail_tf.id === timeframe).candlesPerDay;
          dataLength /= timeframeCandlesPerDay;  
        }
      }
      // assuming max length of selected range (100), this is the time that it takes to process 1k candles
      const timePerThousandCandles = 3;
      const dataLengthThousands = dataLength / 1000;
      const timeWithMaxPatternLength = dataLengthThousands * timePerThousandCandles;
      const timeGivenPatternLength = timeWithMaxPatternLength * patternLength / maxPatternLength;
      console.log(`thousands of records=${dataLengthThousands} 
        pattern length=${patternLength} 
        time with max pattern length=${timeWithMaxPatternLength}
        time given pattern length=${timeGivenPatternLength}
        `)
      return timeGivenPatternLength;
    }
    return null;
  }

  const handlePresetClick = (id: string) => {
    const preset = TIME_PRESETS.find(pr => pr.id === id);
    setSelectedPresetId(preset.id)
    setTimeOfDay(preset.time);
    setTimezone(preset.timezone);
  };

  const handleTimeChange = (value: string) => {
    setTimeOfDay(value);
    setSelectedPresetId(null);
  };

  const handleTimezoneChange = (value: string) => {
    setTimezone(value);
    setSelectedPresetId(null);
  };

  const clearTimeFilter = () => {
    setTimeOfDay("");
    setTimezone("UTC"); // or keep last-used if you prefer
    setSelectedPresetId(null);
  };


  const handleAssetSelect = (assetId: string) => {
    if (!selectedAssets.includes(assetId)) {
      setSelectedAssets((prev) => [...prev, assetId]);
    }
  };

  const handleAssetRemove = (assetId: string) => {
    setSelectedAssets((prev) => prev.filter((id) => id !== assetId));
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

    const timezoneOffset = TIMEZONES.find(tz => tz.id === timezone).offset;

    setIsSearching(true);
    const config: SearchConfig = {
      assets: selectedAssets,
      timeframes: selectedTimeframes,
      dateFrom,
      dateTo,
      timeOfDay,
      timezoneOffset,
      similarityThreshold: similarityThreshold[0],
    };

    // Simulate search delay
    setTimeout(() => {
      setIsSearching(false);
      onSearch(config);
      onOpenChange(false);
    }, 100);
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
                Search and add assets to include in the search
              </p>
              <AssetSearchInput
                assets={AVAILABLE_ASSETS}
                selectedAssets={selectedAssets}
                onAssetSelect={handleAssetSelect}
                onAssetRemove={handleAssetRemove}
                multiSelect={true}
                placeholder="Search and add assets..."
              />
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
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <Label className="text-base font-semibold">Time of Day (Optional)</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Filter patterns by specific trading session or time
              </p>
              
              {/* Time Presets */}
              <div className="grid grid-cols-2 gap-2">
                {TIME_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handlePresetClick(preset.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 text-left ${
                      selectedPresetId === preset.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:bg-secondary/50 hover:border-primary/50"
                    }`}
                  >
                    <span className="text-lg">{preset.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{preset.label}</div>
                      <div className="text-xs text-muted-foreground">{preset.time}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Custom Time Input */}
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary/30">
                <div className="flex-1">
                  <Label htmlFor="customTime" className="text-xs text-muted-foreground mb-1 block">
                    Or enter custom time
                  </Label>
                <Input
                  id="customTime"
                  type="time"
                  value={timeOfDay}
                  onChange={(e) => handleTimeChange(e.target.value)}
                />
                </div>
              </div>

              {/* Timezone Selector */}
              {timeOfDay && 
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary/30">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      Timezone
                    </Label>
                    <Select value={timezone} onValueChange={handleTimezoneChange}>
                      <SelectTrigger className="h-8 bg-background">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-50">
                        {TIMEZONES.map((tz) => (
                          <SelectItem key={tz.id} value={tz.id}>
                            <span className="flex items-center gap-2">
                              <span>{tz.name}</span>
                              <span className="text-xs text-muted-foreground">({tz.offset})</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              }
               {(timeOfDay || selectedPresetId) && (
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive gap-2"
                size="sm"
                onClick={clearTimeFilter}
              >
                Clear Time Settings
              </Button>
            )}
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
                step={1}
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

        <div className="flex flex-col items-end">
          <Button
            onClick={handleSearch}
            disabled={isSearching}
            className="gap-2"
          >
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

          {!isSearching && calculateEstimatedTime() && (
            <span className="mt-1 text-xs text-muted-foreground">
              Estimated search time: {'<'}{Math.ceil(calculateEstimatedTime())} second(s)
            </span>
          )}
        </div>
      </div>

      </DialogContent>
    </Dialog>
  );
};
