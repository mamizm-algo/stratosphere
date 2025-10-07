import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export interface VirtualTransactionParams {
  takeProfit: number;
  stopLoss: number;
  timeHorizon: number;
  position: "long" | "short";
}

interface VirtualTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (params: VirtualTransactionParams) => void;
  initialParams?: VirtualTransactionParams;
}

export const VirtualTransactionDialog = ({
  open,
  onOpenChange,
  onApply,
  initialParams,
}: VirtualTransactionDialogProps) => {
  const [params, setParams] = useState<VirtualTransactionParams>(
    initialParams || {
      takeProfit: 5,
      stopLoss: 2,
      timeHorizon: 10,
      position: "long",
    }
  );

  // Update local state when initialParams change (sync from canvas)
  useEffect(() => {
    if (initialParams && open) {
      setParams(initialParams);
    }
  }, [initialParams, open]);

  const handleApply = () => {
    onApply(params);
    // Don't close the dialog to allow real-time sync
  };

  const handleInputChange = (field: keyof VirtualTransactionParams, value: any) => {
    const newParams = { ...params, [field]: value };
    setParams(newParams);
    // Apply changes immediately for real-time sync
    onApply(newParams);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Virtual Transaction Parameters</DialogTitle>
          <DialogDescription>
            Define the parameters for simulating trade outcomes across all found patterns.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Position Type</Label>
            <RadioGroup
              value={params.position}
              onValueChange={(v) => handleInputChange('position', v as "long" | "short")}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="long" id="long" />
                <Label htmlFor="long" className="cursor-pointer font-normal">
                  Long (Buy)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="short" id="short" />
                <Label htmlFor="short" className="cursor-pointer font-normal">
                  Short (Sell)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="takeProfit">Take Profit (%)</Label>
            <Input
              id="takeProfit"
              type="number"
              step="0.1"
              min="0.1"
              value={params.takeProfit}
              onChange={(e) => handleInputChange('takeProfit', parseFloat(e.target.value) || 0.1)}
            />
            <p className="text-xs text-muted-foreground">
              Percentage gain relative to entry price
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stopLoss">Stop Loss (%)</Label>
            <Input
              id="stopLoss"
              type="number"
              step="0.1"
              min="0.1"
              value={params.stopLoss}
              onChange={(e) => handleInputChange('stopLoss', parseFloat(e.target.value) || 0.1)}
            />
            <p className="text-xs text-muted-foreground">
              Percentage loss relative to entry price
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeHorizon">Time Horizon (candles)</Label>
            <Input
              id="timeHorizon"
              type="number"
              step="1"
              min="1"
              value={params.timeHorizon}
              onChange={(e) => handleInputChange('timeHorizon', parseInt(e.target.value) || 1)}
            />
            <p className="text-xs text-muted-foreground">
              Maximum duration of the trade in candles
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply}>Apply Parameters</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
