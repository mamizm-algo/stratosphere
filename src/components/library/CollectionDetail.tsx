import { useState } from "react";
import { Collection } from "@/types/collection";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { SimilarityResults, SimilarPattern } from "@/components/chart/SimilarityResults";

interface CollectionDetailProps {
  collection: Collection;
  onBack: () => void;
  onUpdateCollection?: (updatedResults: SimilarPattern[]) => void;
}

export const CollectionDetail = ({
  collection,
  onBack,
  onUpdateCollection,
}: CollectionDetailProps) => {
  const [patterns, setPatterns] = useState<SimilarPattern[]>(collection.results);

  const handleClose = () => {
    onBack();
  };

  const handleSaveToLibrary = (pattern: any) => {
    // Already saved in the collection, could show a toast
    console.log("Pattern already in collection:", pattern);
  };

  const handleRemovePattern = (patternId: string) => {
    const updatedPatterns = patterns.filter((p) => p.id !== patternId);
    setPatterns(updatedPatterns);
    onUpdateCollection?.(updatedPatterns);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 px-6 pt-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Library
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        <SimilarityResults
          patterns={patterns}
          onClose={handleClose}
          onSaveToLibrary={handleSaveToLibrary}
          setupCandles={collection.representativeChart}
          onRemovePattern={handleRemovePattern}
          collectionName={collection.name}
        />
      </div>
    </div>
  );
};
