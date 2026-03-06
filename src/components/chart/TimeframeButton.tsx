import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

export type Timeframe = "1m" | "5m" | "15m" | "30m" | "1h";

interface TimeframeButtonProps {
  value: Timeframe;
  onChange: (timeframe: Timeframe) => void;
}

const TIMEFRAME_OPTIONS: { value: Timeframe; label: string }[] = [
  { value: "1m", label: "1 Minute" },
  { value: "5m", label: "5 Minutes" },
  { value: "15m", label: "15 Minutes" },
  { value: "30m", label: "30 Minutes" },
  { value: "1h", label: "1 Hour" },
];

export const TimeframeButton = ({ value, onChange }: TimeframeButtonProps) => {
  return (
    <div className="absolute top-2 left-32 z-10">
      <Select value={value} onValueChange={(v) => onChange(v as Timeframe)}>
        <SelectTrigger
          className="w-32 bg-background/80 backdrop-blur-sm border-border
                     hover:bg-accent text-sm"
        >
          <Clock className="w-4 h-4 " />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TIMEFRAME_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
