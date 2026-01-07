import { Button } from "@/components/ui/button";
import { 
  MousePointer2, 
  TrendingUp, 
  Trash2,
  Search,
  FolderPlus,
  Pencil,
  X,
  MessageCircleQuestion
} from "lucide-react";
import { DrawMode, Volatility } from "@/pages/Chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

interface ToolbarProps {
  drawMode: DrawMode;
  setDrawMode: (mode: DrawMode) => void;
  volatility: Volatility;
  setVolatility: (volatility: Volatility) => void;
  onSearchSimilar: () => void;
  onCompareToCollection: () => void;
  onClear: () => void;
  candleCount: number;
}

export const Toolbar = ({ drawMode, setDrawMode, volatility, setVolatility, onSearchSimilar, onCompareToCollection, onClear, candleCount }: ToolbarProps) => {

  return (
    <div className="border-b border-border bg-card/30 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Drawing tools */}
          {drawMode == "candle" ?
            <div className="flex items-center gap-2">
              <Button
                key="candle"
                variant="default"
                size="sm"
                onClick={() => setDrawMode("select")}
                className="gap-2"
                title="Stop drawing"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Stop drawing</span>
              </Button>
            </div>
            :
            <div className="flex items-center gap-2">
              <Button
                key="candle"
                variant="default"
                size="sm"
                onClick={() => setDrawMode("candle")}
                className="gap-2"
                title="Draw Candles"
              >
                <Pencil className="w-4 h-4" />
                <span className="hidden sm:inline">Draw Candles</span>
              </Button>
            </div>
            }
          
          {/* Clear button */}
          {candleCount > 0 &&
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 text-destructive hover:text-destructive"
              onClick={onClear}
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Clear</span>
            </Button>
          }
         

          <div className="h-6 w-px bg-border" />

          {/* Volatility selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Volatility</span>
            <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                  <MessageCircleQuestion className="w-4 h-4" />
              </TooltipTrigger>

              <TooltipContent>
                <p>
                  Defines the generated length of candle wicks.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
            <Select value={volatility} onValueChange={(v) => setVolatility(v as Volatility)}>
              <SelectTrigger className="w-32 bg-secondary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low (25%)</SelectItem>
                <SelectItem value="medium">Medium (50%)</SelectItem>
                <SelectItem value="high">High (100%)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="h-6 w-px bg-border" />

          {/* Conditional buttons - show only when at least 2 candles are drawn */}
          {candleCount >= 2 && (
            <>
              <Button 
                type="button"
                variant="default" 
                size="sm" 
                className="gap-2 bg-primary hover:bg-primary/90"
                onClick={onSearchSimilar}
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Search Similar</span>
              </Button>

              <Button 
                type="button"
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={onCompareToCollection}
              >
                <FolderPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Compare to Collection</span>
              </Button>

              <div className="h-6 w-px bg-border" />
            </>
          )}

          
        </div>
      </div>
    </div>
  );
};
