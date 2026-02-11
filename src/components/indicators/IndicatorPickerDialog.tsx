import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getIndicatorDefinitions } from "@/lib/indicators/registry";
import { ActiveIndicator } from "@/lib/indicators/types";
import { Check, Plus } from "lucide-react";

interface IndicatorPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeIndicators: ActiveIndicator[];
  onAdd: (definitionId: string) => void;
}

export const IndicatorPickerDialog = ({
  open,
  onOpenChange,
  activeIndicators,
  onAdd,
}: IndicatorPickerDialogProps) => {
  const definitions = getIndicatorDefinitions();

  const isActive = (id: string) => activeIndicators.some((a) => a.definitionId === id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Indicator</DialogTitle>
          <DialogDescription>Select a technical indicator to add to the chart.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1">
          {definitions.map((def) => (
            <div
              key={def.id}
              className="flex items-center justify-between p-3 rounded-md hover:bg-accent/50 transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{def.name}</p>
                <p className="text-xs text-muted-foreground">
                  {def.renderType === "overlay" ? "Overlay" : "Sub-chart"}
                </p>
              </div>
              <Button
                size="sm"
                variant={isActive(def.id) ? "secondary" : "default"}
                onClick={() => {
                  onAdd(def.id);
                  onOpenChange(false);
                }}
                className="gap-1"
              >
                {isActive(def.id) ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                Add
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
