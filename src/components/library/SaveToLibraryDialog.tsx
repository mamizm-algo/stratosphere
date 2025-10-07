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
import { Save } from "lucide-react";
import { toast } from "sonner";

interface SaveToLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string) => void;
}

export const SaveToLibraryDialog = ({
  open,
  onOpenChange,
  onSave,
}: SaveToLibraryDialogProps) => {
  const defaultName = `Collection ${new Date().toLocaleString()}`;
  const [collectionName, setCollectionName] = useState(defaultName);

  const handleSave = () => {
    if (!collectionName.trim()) {
      toast.error("Please enter a collection name");
      return;
    }

    onSave(collectionName.trim());
    onOpenChange(false);
    setCollectionName(defaultName);
  };

  const handleClose = () => {
    onOpenChange(false);
    setCollectionName(defaultName);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save to Library</DialogTitle>
          <DialogDescription>
            Save this similarity search result as a new collection in your library
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="collectionName">Collection Name</Label>
            <Input
              id="collectionName"
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              placeholder="Enter collection name..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSave();
                }
              }}
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-4 border-t border-border">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!collectionName.trim()}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            Save Collection
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
