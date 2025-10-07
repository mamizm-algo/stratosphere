import { Collection } from "@/types/collection";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { SimilarityResults } from "@/components/chart/SimilarityResults";

interface CollectionDetailProps {
  collection: Collection;
  onBack: () => void;
}

export const CollectionDetail = ({
  collection,
  onBack,
}: CollectionDetailProps) => {
  const handleClose = () => {
    onBack();
  };

  const handleSaveToLibrary = (pattern: any) => {
    // Already saved in the collection, could show a toast
    console.log("Pattern already in collection:", pattern);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 mb-6 px-6 pt-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Library
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-foreground">{collection.name}</h2>
          <p className="text-sm text-muted-foreground">
            {collection.results.length} patterns • Created{" "}
            {new Date(collection.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <SimilarityResults
          patterns={collection.results}
          onClose={handleClose}
          onSaveToLibrary={handleSaveToLibrary}
          setupCandles={collection.representativeChart}
        />
      </div>
    </div>
  );
};
