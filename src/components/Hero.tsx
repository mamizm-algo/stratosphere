import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Search, Target, BarChart3, BookmarkCheck, Library } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-hero">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Logo/Brand */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-primary/30 backdrop-blur-sm">
            <TrendingUp className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-foreground">Gyoc Trading Analytics</span>
          </div>

          {/* Main headline */}
          <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-tight">
            Create, Analyze, and
            <span className="bg-gradient-primary bg-clip-text text-transparent"> Predict </span>
            Trading Patterns
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Draw synthetic charts, discover similar historical patterns, and validate your trading strategies with data-driven insights.
          </p>

          {/* CTA Buttons - Primary Flows */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
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
              className="text-lg px-8 py-6 border-2 border-primary/30 hover:border-primary hover:bg-primary/10"
              onClick={() => navigate("/browse-assets")}
            >
              <BarChart3 className="mr-2 w-5 h-5" />
              Browse Assets
            </Button>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-16">
            <FeatureCard
              icon={<TrendingUp className="w-6 h-6" />}
              title="Draw Patterns"
              description="Sketch your own chart patterns using intuitive drawing tools"
            />
            <FeatureCard
              icon={<BarChart3 className="w-6 h-6" />}
              title="Browse Assets"
              description="View real asset charts and select fragments to search"
            />
            <FeatureCard
              icon={<Search className="w-6 h-6" />}
              title="Find Similar"
              description="Search across multiple assets to discover historical matches"
            />
            <FeatureCard
              icon={<BookmarkCheck className="w-6 h-6" />}
              title="Save & Analyze"
              description="Build your library and track pattern performance"
            />
          </div>

          {/* Secondary Action - View Library */}
          <div className="pt-8">
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
      </div>
    </section>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => {
  return (
    <div className="group p-6 rounded-xl bg-card/50 border border-border backdrop-blur-sm hover:border-primary/50 transition-all duration-300 hover:shadow-card">
      <div className="inline-flex p-3 rounded-lg bg-primary/10 text-primary mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};
