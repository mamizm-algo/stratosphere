import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, BarChart3, Library, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Animated background elements */}
      {/* <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-44 bg-primary/40 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/30 rounded-full blur-3xl animate-pulse delay-1000" />
      </div> */}

      <div className="container mx-auto px-6 relative z-10 pb-20">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          {/* Logo/Brand */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-primary/30 backdrop-blur-sm">
            <TrendingUp className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-foreground">Stratosphere Trading Analytics</span>
          </div>
          {/* Subheadline */}
          <p className="text-5xl md:text-3xl text-muted-foreground max-w-4xl mx-auto">
            Research, backtest and validate trades using 
          </p>
          
          {/* Main headline */}
          <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-tight">
            Pattern
            <span className="bg-gradient-primary bg-clip-text text-transparent"> Similarity Score </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-xl text-muted-foreground max-w-xl mx-auto">
            Draw synthetic charts, discover similar historical patterns, and validate your trading strategies with data-driven insights.
          </p>

          {/* CTA Buttons - Primary Flows */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2 ">
            <Button 
              type="button"
              size="lg" 
              className="group text-lg px-8 py-6 bg-primary hover:bg-primary/90 shadow-glow"
              onClick={() => navigate("/chart")}
            >
              Start Drawing
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="text-lg px-8 py-6 border-2 border-primary/30 bg-secondary hover:border-primary hover:bg-primary/10"
              onClick={() => navigate("/browse-assets")}
            >
              <BarChart3 className="mr-2 w-5 h-5" />
              Browse Assets
            </Button>
          </div>

          {/* Library message */}
          <div className="pt-6">
            <p className="text-lg text-muted-foreground">
              Already found your similar results? You can go through them in the library!
            </p>
          </div>

          {/* Secondary Action - View Library */}
          <div className="pt-3">
            <Button 
              type="button"
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6 border-2 border-accent/30 hover:border-accent hover:bg-accent/10"
              onClick={() => navigate("/library")}
            >
              <Library className="mr-2 w-5 h-5" />
              View Library
            </Button>
          </div>
        </div>
      {/* Scroll indicator */}
      {/* <div className="mt-20 flex flex-col items-center animate-bounce">
        <span className="text-sm text-muted-foreground font-medium">See how it works</span>
        <ChevronDown className="w-6 h-6 text-primary" />
      </div> */}
      </div>

    </section>
  );
};

