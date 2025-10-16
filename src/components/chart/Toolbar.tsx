import { Button } from "@/components/ui/button";
import { 
  MousePointer2, 
  TrendingUp, 
  Trash2,
  Search,
  FolderPlus
} from "lucide-react";
import { DrawMode, Volatility } from "@/pages/Chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const tools = [
    // { id: "select" as DrawMode, icon: MousePointer2, label: "Select" },
    { id: "candle" as DrawMode, icon: TrendingUp, label: "Draw Candles" },
  ];

  return (
    <div className="border-b border-border bg-card/30 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Drawing tools */}
          <div className="flex items-center gap-2">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Button
                  key={tool.id}
                  variant={drawMode === tool.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setDrawMode(tool.id)}
                  className="gap-2"
                  title={tool.label}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tool.label}</span>
                </Button>
              );
            })}
          </div>

          <div className="h-6 w-px bg-border" />

          {/* Volatility selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Volatility:</span>
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

          {/* Clear button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-2 text-destructive hover:text-destructive"
            onClick={onClear}
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Clear</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
