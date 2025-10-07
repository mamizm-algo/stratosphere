import { Button } from "@/components/ui/button";
import { TrendingUp, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const ChartHeader = () => {
  const navigate = useNavigate();

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-bold text-foreground">Gyoc</span>
          </div>
        </div>

        <Button 
          type="button"
          variant="ghost" 
          size="sm"
          onClick={() => navigate("/")}
          className="gap-2"
        >
          <Home className="w-4 h-4" />
          Home
        </Button>
      </div>
    </header>
  );
};
