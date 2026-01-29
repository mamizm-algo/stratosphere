import { Button } from "@/components/ui/button";
import { TrendingUp, PenTool, BarChart3, Library, Home, FlaskConical, Rocket } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const HomeHeader = () => {
  const navigate = useNavigate();

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <div className="rounded-lg" onClick={() => navigate("/")}>
              <img
                src="/name_logo.png"
                alt="Stratosphere logo"
                className="h-8 object-contain"
              />
            </div>
          </div>

        <nav className="flex items-center gap-1 md:gap-2">
          <Button 
            type="button"
            variant="ghost" 
            size="sm"
            onClick={() => navigate("/chart")}
            className="gap-2"
          >
            <PenTool className="w-4 h-4" />
            <span className="hidden sm:inline">Draw Chart</span>
          </Button>
          <Button 
            type="button"
            variant="ghost" 
            size="sm"
            onClick={() => navigate("/browse-assets")}
            className="gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Browse Assets</span>
          </Button>
          <Button 
            type="button"
            variant="ghost" 
            size="sm"
            onClick={() => navigate("/library")}
            className="gap-2"
          >
            <Library className="w-4 h-4" />
            <span className="hidden sm:inline">Library</span>
          </Button>
          <Button 
            type="button"
            variant="ghost" 
            size="sm"
            onClick={() => navigate("/sandbox")}
            className="gap-2"
          >
            <FlaskConical className="w-4 h-4" />
            <span className="hidden sm:inline">Sandbox</span>
          </Button>
          <Button 
            type="button"
            variant="ghost" 
            size="sm"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </Button>
          <Button 
            type="button"
            variant="default" 
            size="sm"
            onClick={() => navigate("/launching-soon")}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            <Rocket className="w-4 h-4" />
            <span className="hidden sm:inline">Launching Soon</span>
          </Button>
        </nav>
      </div>
    </header>
  );
};
