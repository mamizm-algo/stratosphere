import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";

interface IndicatorsButtonProps {
  onClick: () => void;
}

export const IndicatorsButton = ({ onClick }: IndicatorsButtonProps) => {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="absolute top-2 left-2 z-10 gap-1.5 bg-background/80 backdrop-blur-sm border-border hover:bg-accent"
    >
      <BarChart3 className="w-4 h-4" />
      <span className="hidden sm:inline">Indicators</span>
    </Button>
  );
};
