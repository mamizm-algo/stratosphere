import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Asset {
  id: string;
  name: string;
}

interface AssetSearchInputProps {
  assets: Asset[];
  selectedAssets: string[];
  onAssetSelect: (assetId: string) => void;
  onAssetRemove?: (assetId: string) => void;
  multiSelect?: boolean;
  placeholder?: string;
  className?: string;
}

export const AssetSearchInput = ({
  assets,
  selectedAssets,
  onAssetSelect,
  onAssetRemove,
  multiSelect = false,
  placeholder = "Search asset...",
  className,
}: AssetSearchInputProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredAssets = assets.filter(
    (asset) =>
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (assetId: string) => {
    onAssetSelect(assetId);
    if (!multiSelect) {
      setSearchQuery("");
      setIsOpen(false);
    } else {
      setSearchQuery("");
      inputRef.current?.focus();
    }
  };

  const handleRemove = (assetId: string) => {
    if (onAssetRemove) {
      onAssetRemove(assetId);
    }
  };

  const getSelectedAssetName = () => {
    if (!multiSelect && selectedAssets.length > 0) {
      const asset = assets.find((a) => a.id === selectedAssets[0]);
      return asset ? `${asset.name} (${asset.id})` : selectedAssets[0];
    }
    return "";
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Multi-select chips */}
      {multiSelect && selectedAssets.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedAssets.map((assetId) => {
            const asset = assets.find((a) => a.id === assetId);
            return (
              <Badge
                key={assetId}
                variant="secondary"
                className="flex items-center gap-1 pr-1"
              >
                <span>{asset?.name || assetId}</span>
                <span className="text-muted-foreground text-xs">({assetId})</span>
                <button
                  type="button"
                  onClick={() => handleRemove(assetId)}
                  className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={multiSelect ? searchQuery : (searchQuery || (!isOpen ? getSelectedAssetName() : searchQuery))}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            if (!multiSelect) {
              setSearchQuery("");
            }
          }}
          placeholder={placeholder}
          className="pl-9"
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredAssets.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No assets found
            </div>
          ) : (
            filteredAssets.map((asset) => {
              const isSelected = selectedAssets.includes(asset.id);
              return (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => handleSelect(asset.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                    isSelected && "bg-accent/50"
                  )}
                >
                  <span className="font-medium">{asset.name}</span>
                  <span className="ml-2 text-muted-foreground">{asset.id}</span>
                  {isSelected && multiSelect && (
                    <span className="ml-2 text-primary text-xs">✓</span>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
