import { Collection } from "@/types/collection";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FolderOpen, Trash2, Calendar } from "lucide-react";
import { MockChartDisplay } from "@/components/chart/MockChartDisplay";

interface CollectionCardProps {
  collection: Collection;
  onOpen: (collection: Collection) => void;
  onDelete: (id: string) => void;
}

export const CollectionCard = ({
  collection,
  onOpen,
  onDelete,
}: CollectionCardProps) => {
  const averageSimilarity =
    collection.results.length > 0
      ? Math.round(
          collection.results.reduce((sum, r) => sum + r.similarity, 0) /
            collection.results.length
        )
      : 0;

  return (
    <Card className="p-5 hover:shadow-glow transition-all group cursor-pointer">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1" onClick={() => onOpen(collection)}>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            {collection.name}
          </h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-3 h-3" />
            {new Date(collection.createdAt).toLocaleDateString()}
          </div>
        </div>
        <Badge variant="secondary" className="bg-primary/10 text-primary">
          {collection.results.length} patterns
        </Badge>
      </div>

      {/* Representative chart */}
      <div
        className="h-32 rounded-md bg-chart-bg border border-chart-grid mb-4 overflow-hidden"
        onClick={() => onOpen(collection)}
      >
        <MockChartDisplay
          candles={collection.representativeChart}
          width={300}
          height={128}
          showControls={false}
          chartType="candle"
          opacity={1}
        />
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">
          Avg Similarity: <span className="text-primary font-medium">{averageSimilarity}%</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 gap-2"
          onClick={() => onOpen(collection)}
        >
          <FolderOpen className="w-4 h-4" />
          Open
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-destructive hover:text-destructive gap-2"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(collection.id);
          }}
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </Button>
      </div>
    </Card>
  );
};
