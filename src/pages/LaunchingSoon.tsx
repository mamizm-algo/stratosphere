import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  TrendingUp,
  Search,
  BarChart3,
  Target,
  FlaskConical,
  ChevronDown,
  Twitter,
  Linkedin,
  Github,
  Mail,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const LaunchingSoon = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [acceptEmails, setAcceptEmails] = useState(false);

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    if (!acceptPrivacy) {
      toast.error("Please accept the privacy policy");
      return;
    }
    // Placeholder - will be replaced with actual Google Form submission
    toast.success("Thanks for joining! We'll be in touch soon.");
    setEmail("");
    setAcceptPrivacy(false);
    setAcceptEmails(false);
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl text-foreground">STRATOSPHERE</span>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => scrollToSection("features")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("sandbox")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Sandbox
            </button>
            <button
              onClick={() => scrollToSection("faq")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              FAQ
            </button>
            <Button
              onClick={() => scrollToSection("waitlist")}
              size="sm"
              className="bg-primary hover:bg-primary/90"
            >
              Join Waitlist
            </Button>
          </nav>

          <Button
            onClick={() => scrollToSection("waitlist")}
            size="sm"
            className="md:hidden bg-primary hover:bg-primary/90"
          >
            Join Waitlist
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section
        id="waitlist"
        className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-hero py-16 md:py-24"
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-primary/30 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Launching Soon
              </span>
            </div>

            {/* Main headline */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
              Research, backtest and validate trades using{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Pattern Similarity Score
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Stratosphere helps traders discover similar historical patterns,
              eliminate subjective bias, and validate trading strategies with
              data-driven insights — before risking real capital.
            </p>

            {/* Waitlist Form */}
            <div className="max-w-md mx-auto pt-4">
              <div className="bg-card/80 backdrop-blur-sm border border-border rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Join the Waitlist
                </h3>
                <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-background/50"
                  />

                  <div className="space-y-3 text-left">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="privacy"
                        checked={acceptPrivacy}
                        onCheckedChange={(checked) =>
                          setAcceptPrivacy(checked === true)
                        }
                      />
                      <Label
                        htmlFor="privacy"
                        className="text-sm text-muted-foreground cursor-pointer"
                      >
                        I accept the privacy policy
                      </Label>
                    </div>

                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="emails"
                        checked={acceptEmails}
                        onCheckedChange={(checked) =>
                          setAcceptEmails(checked === true)
                        }
                      />
                      <Label
                        htmlFor="emails"
                        className="text-sm text-muted-foreground cursor-pointer"
                      >
                        I agree to receive emails from Stratosphere
                      </Label>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 shadow-glow"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Join the Waitlist
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-sm text-muted-foreground font-medium">
            Learn more
          </span>
          <ChevronDown className="w-6 h-6 text-primary" />
        </div>
      </section>

      {/* Problem & Solution Section */}
      <section id="features" className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-6">
          {/* Problem Statement */}
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              The Problem with Pattern Trading
            </h2>
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div className="bg-card/50 border border-border rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-destructive/10 shrink-0">
                    <AlertCircle className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">
                      Subjectivity Bias
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Traders see patterns that may not exist, leading to
                      emotional decisions and losing trades. What looks like a
                      clear setup to one person looks completely different to
                      another.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card/50 border border-border rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-destructive/10 shrink-0">
                    <AlertCircle className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">
                      Broken Backtesting
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Classic backtesting is either too manual (unreliable and
                      time-consuming) or too technical (forces rigid,
                      rule-based strategies that miss nuance).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Solution - How It Works */}
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-4">
              How Stratosphere Solves This
            </h2>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              A simple 3-step workflow that turns subjective pattern recognition
              into objective, data-driven analysis.
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="space-y-4">
                <div className="aspect-video bg-card/50 border border-border rounded-xl flex items-center justify-center">
                  <div className="text-center p-4">
                    <Target className="w-12 h-12 text-primary mx-auto mb-2" />
                    <span className="text-sm text-muted-foreground">
                      Pattern selection preview
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">
                      Define a Pattern
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Select a fragment of an existing price chart, or draw a
                      custom pattern that represents your trading idea.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="space-y-4">
                <div className="aspect-video bg-card/50 border border-border rounded-xl flex items-center justify-center">
                  <div className="text-center p-4">
                    <Search className="w-12 h-12 text-primary mx-auto mb-2" />
                    <span className="text-sm text-muted-foreground">
                      Search configuration preview
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">
                      Set Search Criteria
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Choose assets, timeframes, date ranges, and minimum
                      similarity threshold to find relevant matches.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="space-y-4">
                <div className="aspect-video bg-card/50 border border-border rounded-xl flex items-center justify-center">
                  <div className="text-center p-4">
                    <BarChart3 className="w-12 h-12 text-primary mx-auto mb-2" />
                    <span className="text-sm text-muted-foreground">
                      Results analysis preview
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">3</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">
                      Analyze Results
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Review historical matches with outcome statistics. Simulate
                      the same trade across all matches for objective results.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Benefits */}
            <div className="mt-16 grid sm:grid-cols-3 gap-6">
              <div className="flex items-start gap-3 p-4 bg-card/30 rounded-lg border border-border/50">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-foreground text-sm">
                    Deterministic Algorithm
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Same input always produces the same results
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-card/30 rounded-lg border border-border/50">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-foreground text-sm">
                    No Curve Fitting
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Test ideas without overfitting to historical data
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-card/30 rounded-lg border border-border/50">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-foreground text-sm">
                    Multi-Asset Support
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Crypto, forex, stocks — all in one place
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sandbox Section */}
      <section
        id="sandbox"
        className="py-20 md:py-28 bg-gradient-to-b from-background to-card/30"
      >
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6">
              <FlaskConical className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Try It Now
              </span>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Experiment with the Similarity Sandbox
            </h2>

            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              See how similarity scoring works before you even sign up. The
              Sandbox lets you experiment with our algorithm and build intuition
              for pattern matching — no commitment required.
            </p>

            <div className="bg-card/50 border border-border rounded-xl p-8 mb-8">
              <div className="aspect-video bg-background/50 rounded-lg flex items-center justify-center mb-6">
                <div className="text-center">
                  <FlaskConical className="w-16 h-16 text-primary mx-auto mb-3" />
                  <p className="text-muted-foreground">Sandbox preview</p>
                </div>
              </div>

              <Button
                size="lg"
                onClick={() => navigate("/sandbox")}
                className="bg-primary hover:bg-primary/90 shadow-glow"
              >
                <FlaskConical className="w-5 h-5 mr-2" />
                Try the Similarity Sandbox
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              Note: The Sandbox is a demo environment. The full product will
              include more features and assets.
            </p>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 bg-background border-y border-border">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid sm:grid-cols-3 gap-8 text-center">
              <div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">
                  Built by Traders
                </h3>
                <p className="text-sm text-muted-foreground">
                  Created by traders who understand the challenges of
                  pattern-based strategies
                </p>
              </div>
              <div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Search className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">
                  Early Access Coming
                </h3>
                <p className="text-sm text-muted-foreground">
                  Join the waitlist to be among the first to try the full
                  platform
                </p>
              </div>
              <div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">
                  Case Studies Soon
                </h3>
                <p className="text-sm text-muted-foreground">
                  Real-world examples and results will be shared after launch
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 md:py-28 bg-card/20">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground text-center mb-12">
              Have more questions? Reach out to us on social media.
            </p>

            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem
                value="item-1"
                className="bg-card/50 border border-border rounded-xl px-6"
              >
                <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline">
                  What markets does Stratosphere support?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Stratosphere is designed to work with multiple asset classes
                  including cryptocurrencies, forex pairs, and stocks. We're
                  continuously adding more assets and markets based on user
                  demand.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="item-2"
                className="bg-card/50 border border-border rounded-xl px-6"
              >
                <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline">
                  Is this for beginners or advanced traders?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Stratosphere is built for traders of all experience levels.
                  Beginners will appreciate the visual, intuitive approach to
                  pattern analysis. Advanced traders will value the objective,
                  data-driven validation of their strategies.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="item-3"
                className="bg-card/50 border border-border rounded-xl px-6"
              >
                <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline">
                  When will the full product launch?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  We're currently in development with a target launch in 2025.
                  Join the waitlist to be notified when we open early access and
                  to get priority access to new features.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="item-4"
                className="bg-card/50 border border-border rounded-xl px-6"
              >
                <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline">
                  How is this different from regular backtesting?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Traditional backtesting requires you to define rigid,
                  rule-based strategies. Stratosphere uses visual pattern
                  matching and similarity scoring, which lets you test ideas
                  based on how charts "look" rather than specific indicator
                  values.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="item-5"
                className="bg-card/50 border border-border rounded-xl px-6"
              >
                <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline">
                  Is there a free tier?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Pricing details will be announced closer to launch. We plan to
                  offer options for different types of traders. The Similarity
                  Sandbox is currently free to use.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-28 bg-gradient-hero">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to Trade with Confidence?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join the waitlist and be the first to know when Stratosphere
              launches.
            </p>
            <Button
              size="lg"
              onClick={() => scrollToSection("waitlist")}
              className="bg-primary hover:bg-primary/90 shadow-glow"
            >
              <Mail className="w-5 h-5 mr-2" />
              Join the Waitlist
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-background border-t border-border">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              {/* Logo */}
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xl text-foreground">STRATOSPHERE</span>
              </div>

              {/* Links */}
              <nav className="flex items-center gap-6">
                <button
                  onClick={() => scrollToSection("features")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Features
                </button>
                <button
                  onClick={() => scrollToSection("sandbox")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sandbox
                </button>
                <button
                  onClick={() => scrollToSection("faq")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  FAQ
                </button>
                <button
                  onClick={() => scrollToSection("waitlist")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Waitlist
                </button>
              </nav>

              {/* Social Icons */}
              <div className="flex items-center gap-4">
                <a
                  href="#"
                  className="p-2 rounded-lg bg-card/50 border border-border hover:bg-card transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="w-4 h-4 text-muted-foreground" />
                </a>
                <a
                  href="#"
                  className="p-2 rounded-lg bg-card/50 border border-border hover:bg-card transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-4 h-4 text-muted-foreground" />
                </a>
                <a
                  href="#"
                  className="p-2 rounded-lg bg-card/50 border border-border hover:bg-card transition-colors"
                  aria-label="GitHub"
                >
                  <Github className="w-4 h-4 text-muted-foreground" />
                </a>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Stratosphere. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LaunchingSoon;
