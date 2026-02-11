import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IndicatorParam } from "@/lib/indicators/types";

interface IndicatorConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  indicatorName: string;
  params: IndicatorParam[];
  currentValues: Record<string, number>;
  onConfirm: (values: Record<string, number>) => void;
}

export const IndicatorConfigDialog = ({
  open,
  onOpenChange,
  indicatorName,
  params,
  currentValues,
  onConfirm,
}: IndicatorConfigDialogProps) => {
  const [values, setValues] = useState<Record<string, number>>(currentValues);

  useEffect(() => {
    setValues(currentValues);
  }, [currentValues, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate all positive numbers
    for (const p of params) {
      const v = values[p.key];
      if (v === undefined || v <= 0 || isNaN(v)) return;
      if (p.min !== undefined && v < p.min) return;
      if (p.max !== undefined && v > p.max) return;
    }
    onConfirm(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Configure {indicatorName}</DialogTitle>
          <DialogDescription>Adjust indicator parameters.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {params.map((p) => (
            <div key={p.key} className="space-y-1.5">
              <Label htmlFor={p.key} className="text-sm">
                {p.label}
                {p.min !== undefined && p.max !== undefined && (
                  <span className="text-muted-foreground ml-1">({p.min}–{p.max})</span>
                )}
              </Label>
              <Input
                id={p.key}
                type="number"
                min={p.min}
                max={p.max}
                value={values[p.key] ?? p.default}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [p.key]: Number(e.target.value) }))
                }
              />
            </div>
          ))}
          <DialogFooter>
            <Button type="submit" size="sm">Apply</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
