import { PenTool, BarChart3, Search, BookmarkCheck } from "lucide-react";
import { MockChartDisplay, generateMockCandles } from "@/components/chart/MockChartDisplay";

export const HowItWorks = () => {
  return (
    <section className="py-24 bg-card/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find similar historical patterns in three simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 max-w-6xl mx-auto">
          {/* Step 1: Input */}
          <div className="group">
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground shadow-glow">
                1
              </div>
              <div className="p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-card">
                <div className="mb-6">
                  <div className="inline-flex p-4 rounded-xl bg-primary/10 text-primary mb-4 group-hover:scale-110 transition-transform">
                    <PenTool className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-semibold text-foreground mb-3">
                    Create Your Pattern
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Draw your own chart pattern using intuitive tools, or select a fragment from real asset charts.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-border/50">
                    <PenTool className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-foreground mb-1">Draw Custom</div>
                      <div className="text-sm text-muted-foreground">Sketch patterns from your imagination</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-border/50">
                    <BarChart3 className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-foreground mb-1">Select Fragment</div>
                      <div className="text-sm text-muted-foreground">Choose from real historical data</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Search */}
          <div className="group">
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground shadow-glow">
                2
              </div>
              <div className="p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-card">
                <div className="mb-6">
                  <div className="inline-flex p-4 rounded-xl bg-primary/10 text-primary mb-4 group-hover:scale-110 transition-transform">
                    <Search className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-semibold text-foreground mb-3">
                    AI Pattern Search
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Our algorithm scans thousands of historical charts to find patterns similar to yours.
                  </p>
                </div>

                <div className="relative h-48 rounded-lg bg-chart-bg border border-chart-grid overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 animate-ping">
                        <div className="w-16 h-16 rounded-full bg-primary/20" />
                      </div>
                      <Search className="w-16 h-16 text-primary relative z-10 animate-pulse" />
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-chart-bg via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div 
                        key={i}
                        className="flex-1 h-1 rounded-full bg-primary/30 overflow-hidden"
                        style={{ animationDelay: `${i * 200}ms` }}
                      >
                        <div className="h-full bg-primary animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Analyze */}
          <div className="group">
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground shadow-glow">
                3
              </div>
              <div className="p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-card">
                <div className="mb-6">
                  <div className="inline-flex p-4 rounded-xl bg-primary/10 text-primary mb-4 group-hover:scale-110 transition-transform">
                    <BookmarkCheck className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-semibold text-foreground mb-3">
                    Analyze & Save
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Review similarity scores, analyze outcomes, and save patterns to your library for future reference.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Similarity Score</span>
                      <span className="text-sm font-bold text-primary">94%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-gradient-primary w-[94%] animate-scale-in" />
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Similarity Score</span>
                      <span className="text-sm font-bold text-primary">87%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-gradient-primary w-[87%] animate-scale-in" style={{ animationDelay: "100ms" }} />
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Similarity Score</span>
                      <span className="text-sm font-bold text-primary">82%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-gradient-primary w-[82%] animate-scale-in" style={{ animationDelay: "200ms" }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Example Section */}
        <div className="mt-24 max-w-5xl mx-auto">
          <div className="p-8 rounded-2xl bg-card border border-border">
            <h3 className="text-2xl font-semibold text-foreground mb-6 text-center">
              Example: From Pattern to Results
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="space-y-3">
                <div className="text-sm font-medium text-muted-foreground text-center">Your Input</div>
                <div className="rounded-lg border border-primary/50 overflow-hidden">
                  <MockChartDisplay candles={generateMockCandles(8, 100, "up")} width={280} height={180} showControls={false} chartType="candle" />
                </div>
              </div>

              <div className="flex justify-center">
                <div className="flex flex-col items-center gap-2">
                  <Search className="w-8 h-8 text-primary animate-pulse" />
                  <div className="text-sm text-muted-foreground">AI Search</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-medium text-muted-foreground text-center">Similar Matches</div>
                <div className="space-y-2">
                  {[92, 88, 85].map((score, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50 border border-border/50 animate-fade-in" style={{ animationDelay: `${idx * 150}ms` }}>
                      <div className="w-20 h-12 rounded border border-primary/30 bg-chart-bg flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground">Match #{idx + 1}</div>
                        <div className="text-sm font-semibold text-primary">{score}% Similar</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
