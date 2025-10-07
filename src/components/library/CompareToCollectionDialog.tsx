import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collection } from "@/types/collection";
import { CandleData } from "@/components/chart/MockChartDisplay";
import { FolderOpen, TrendingUp } from "lucide-react";

interface CompareToCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collections: Collection[];
  chartData: CandleData[];
}

export const CompareToCollectionDialog = ({
  open,
  onOpenChange,
  collections,
  chartData,
}: CompareToCollectionDialogProps) => {
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [similarityScore, setSimilarityScore] = useState<number | null>(null);

  const calculateSimilarity = (collection: Collection) => {
    // Mock similarity calculation - random score between 60-95%
    const score = Math.floor(Math.random() * 35) + 60;
    return score;
  };

  const handleSelectCollection = (collection: Collection) => {
    setSelectedCollection(collection);
    const score = calculateSimilarity(collection);
    setSimilarityScore(score);
  };

  const handleClose = () => {
    setSelectedCollection(null);
    setSimilarityScore(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Compare to Collection</DialogTitle>
          <DialogDescription>
            Select a collection to compare your drawn pattern with its representative pattern
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          {collections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FolderOpen className="w-12 h-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">
                No collections yet. Create one by saving similarity search results.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {collections.map((collection) => (
                <Card
                  key={collection.id}
                  className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedCollection?.id === collection.id
                      ? "ring-2 ring-primary"
                      : ""
                  }`}
                  onClick={() => handleSelectCollection(collection)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">
                        {collection.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {collection.results.length} patterns
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {new Date(collection.createdAt).toLocaleDateString()}
                    </Badge>
                  </div>

                  {selectedCollection?.id === collection.id && similarityScore !== null && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">
                          Similarity Score:
                        </span>
                        <Badge className="bg-primary/10 text-primary">
                          {similarityScore}%
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        This is a comparison view only. Your pattern is not added to the collection.
                      </p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex gap-2 justify-end pt-4 border-t border-border">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
