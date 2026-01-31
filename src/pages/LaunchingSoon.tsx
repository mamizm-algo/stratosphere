import { useEffect, useState } from "react";
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
  Mail,
  CheckCircle2,
  Sparkles,
  MessageCircle,
  Users,
  LineChart,
  ArrowRight,
  Microscope
} from "lucide-react";
import { FaInstagram, FaLinkedin } from "react-icons/fa";

import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const LaunchingSoon = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [becomeTester, setBecomeTester] = useState(false);
  const [acceptEmails, setAcceptEmails] = useState(false);

  

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    if (!acceptEmails) {
      toast.error("Please accept the privacy policy");
      return;
    }

    const formUrl = "https://docs.google.com/forms/d/e/1FAIpQLSc0ms4dmsszIi7-nRnWUWzaSkDOdtA0XCLc8Bex8dz7RWHGLg/formResponse";
    const data = new FormData();

    if (becomeTester) {
      // tester entry id
      data.append("entry.1676179579", email);
      toast.success("Thanks for becoming a tester! We'll be in touch soon.");

    } else {
      // waitlist entry id
      data.append("entry.2125015247", email);
      toast.success("Thanks for joining! We'll be in touch soon.");
    }

    await fetch(formUrl, {
      method: "POST",
      mode: "no-cors", // important
      body: data,
    });
    
    setEmail("");
    setAcceptEmails(false);
    setBecomeTester(false);

  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const elements = document.querySelectorAll(".animate-on-scroll");

    console.log("Found elements:", elements.length);

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.remove("opacity-0", "translate-y-10");
            entry.target.classList.add("opacity-100", "translate-y-0");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-accent bg-card backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg" onClick={() => scrollToSection("waitlist")}>
              <img
                src="/name_logo.png"
                alt="Stratosphere logo"
                className="h-8 object-contain"
              />
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => scrollToSection("features")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </button>
             <button
              onClick={() => scrollToSection("case")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Use case
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
        </div>
      </header>

      {/* Hero Section */}
      <section
        id="waitlist"
        className="relative flex items-center justify-center overflow-hidden py-16 scroll-mt-24"
        // className="relative flex items-center justify-center overflow-hidden py-16"
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-primary/30 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Launching Soon
              </span>
            </div>

            {/* Main headline */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
              Research, backtest and validate trades using{" "}
              <span className="bg-gradient-primary bg-clip-text text-primary">
                Pattern Similarity Score
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              STRATOSPHERE helps traders discover similar historical patterns,
              eliminate subjective bias, and validate trading strategies with
              data-driven insights — before risking real capital.
            </p>

            {/* Waitlist Form */}
           <div className="mx-auto pt-4">
              <div className="bg-card backdrop-blur-sm border border-primary hover:shadow-glow rounded-xl p-6 space-y-4">
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
                        id="tester"
                        checked={becomeTester}
                        onCheckedChange={(checked) =>
                          setBecomeTester(checked === true)
                        }
                      />
                      <Label
                        htmlFor="tester"
                        className="text-foreground cursor-pointer"
                      >
                        Become a Tester - you will become an invaluable part of shaping STRATOSPHERE's most important features
                        and delivering feedback to how they solve your problems.
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
                        className="text-xs text-muted-foreground cursor-pointer"
                      >
                      I agree to receive access updates and marketing emails from STRATOSPHERE. By joining the waitlist, you also agree to our Privacy Policy.
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
            {/* Scroll indicator */}
            <div className="mt-20 flex flex-col items-center animate-bounce">
              <span className="text-sm text-muted-foreground font-medium">Learn more</span>
              <ChevronDown className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section - Premium Storytelling */}
      <section id="features" className="py-24 md:py-36">
        <div className="container mx-auto px-6">
          <div className="max-w-8xl mx-auto">
            {/* Solution headline */}
            <div className="text-center space-y-6 mb-20">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
                Objective, repeatable,<br />
                <span className="bg-gradient-primary bg-clip-text text-primary">reliable</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                STRATOSPHERE replaces guesswork with historical evidence.
              </p>
            </div>

            {/* 3-Step Flow */}
            <div className="grid md:grid-cols-3 gap-12 md:gap-8">
              {/* Step 1 */}
              <div className="space-y-6">
                <div
                //  className="aspect-video border border-primary rounded-xl hover:shadow-glow flex items-center justify-center overflow-hidden">
                 className="
                  aspect-video border border-primary rounded-xl hover:shadow-glow
                  flex items-center justify-center overflow-hidden
                  transition-all duration-700 delay-600 ease-out
                  opacity-0 translate-y-10
                  animate-on-scroll
                ">  
                <img
                    src="/features_browse.png"
                    alt="Pattern selection preview"
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <span className="text-lg font-bold text-primary-foreground">1</span>
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">
                      Define Your Pattern
                    </h3>
                  </div>
                  <p className="text-muted-foreground pl-13">
                    Select a fragment from any chart — or draw the pattern you're looking for.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="space-y-6">
                <div 
                // className="aspect-video  border border-primary rounded-xl hover:shadow-glow bg-card flex items-center justify-center overflow-hidden">
                    className="
                  aspect-video border border-primary rounded-xl hover:shadow-glow
                  flex items-center justify-center overflow-hidden
                  transition-all duration-700 delay-400 ease-out
                  opacity-0 translate-y-10
                  animate-on-scroll
                ">  
                   <img
                    src="/features_collection.png"
                    alt="Result collection preview"
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <span className="text-lg font-bold text-primary-foreground">2</span>
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">
                      Search History
                    </h3>
                  </div>
                  <p className="text-muted-foreground pl-13">
                    Our algorithm scans thousands of historical charts to find similar patterns.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="space-y-6">
                <div 
                // className="aspect-video bg-card border border-primary rounded-xl hover:shadow-glow flex items-center justify-center overflow-hidden">
                 className="
                  aspect-video border border-primary rounded-xl hover:shadow-glow
                  flex items-center justify-center overflow-hidden
                  transition-all duration-700 delay-200 ease-out
                  opacity-0 translate-y-10
                  animate-on-scroll
                ">     
                <img
                    src="/features_outcomes.png"
                    alt="Outcomes preview"
                    className="h-full object-cover "
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <span className="text-lg font-bold text-primary-foreground">3</span>
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">
                      Analyze Outcomes
                    </h3>
                  </div>
                  <p className="text-muted-foreground pl-13">
                    See what happened after each match. Get statistics. Make informed decisions.
                  </p>
                </div>
              </div>
            </div>

            {/* Key Benefits */}
            <div className="mt-24 grid sm:grid-cols-3 gap-6">
              <div className="flex items-start gap-4 p-6 bg-card rounded-xl border border-border/50">
                <CheckCircle2 className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-foreground mb-1">
                    Objective
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Remove emotions and bias from your strategy research with Pattern Similarity Score.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-6 bg-card rounded-xl border border-border/50">
                <CheckCircle2 className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-foreground mb-1">
                    Repeatable
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Same input, same results. Find all charts matching your strategy in the matter of seconds.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-6 bg-card rounded-xl border border-border/50">
                <CheckCircle2 className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-foreground mb-1">
                    Reliable
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    You are in control of the strategy, entry and exit conditions - we give you the data to make the best decision.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Case Study Section - Instagram Poll Example */}
      <section id="case" className="py-28 md:py-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            {/* Section header */}
            <div className="text-center space-y-6 mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
                <MessageCircle className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Real Example</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
                From opinions to evidence
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                See how Stratosphere transforms a social media debate into data-driven insight.
              </p>
            </div>

            {/* Case study content */}
            <div className="space-y-10">
              {/* The scenario */}
              <div className="bg-card border border-border rounded-2xl p-6 md:p-6">
                <div className="grid lg:grid-cols-2 gap-10 items-center">
                  {/* Left: Instagram mock */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Users className="w-5 h-5" />
                      <span className="text-sm font-medium">The Scenario</span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-semibold text-foreground">
                      "Will price go up or down?"
                    </h3>
                    <p className="text-muted-foreground text-lg">
                      A popular trading account posts a chart and asks followers to vote. 
                      Thousands respond — opinions split, heated debates follow. 
                      <span className="text-foreground font-medium"> No one has evidence.</span>
                    </p>
                    
                    {/* Mock Instagram poll */}
                    <div className="bg-background border border-border rounded-xl p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">@trading_guru</div>
                          <div className="text-xs text-muted-foreground">2.4M followers</div>
                        </div>
                      </div>
                      <img
                    src="/guess_trade.png"
                    alt="Pattern selection preview"
                    className="w-full h-full object-cover rounded-xl"
                  />
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-10 bg-bullish/20 rounded-lg flex items-center px-4">
                            <span className="text-sm text-foreground">🚀 Up</span>
                          </div>
                          <span className="text-sm text-muted-foreground w-10">52%</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-10 bg-bearish/20 rounded-lg flex items-center px-4">
                            <span className="text-sm text-foreground">📉 Down</span>
                          </div>
                          <span className="text-sm text-muted-foreground w-12">48%</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground text-center">12,847 votes • 3 hours left</p>
                    </div>
                  </div>

                  {/* Right side */}
                  <div className="space-y-10">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Microscope className="w-5 h-5" />
                    <span className="text-sm font-medium">The Research</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-semibold text-foreground">
                    "What happened historically when a chart looked like this?"
                  </h3>
                  <div className="bg-background border border-border rounded-xl p-2 space-y-4">
                    <img
                      src="/answer_trade.png"
                      alt="Trade research"
                      className="w-full h-full object-cover my-1 rounded-xl zoom-hover transition-transform"
                    />
                    <div className="space-y-2 mx-3 py-1">
                      {/* Up */}
                      <div className="flex items-center gap-3">
                        <div
                          className="h-10 bg-bullish/20 rounded-lg flex items-center px-2 min-w-[20px]"
                          // style={{ width: `62.3%` }}
                          style={{ width: `100%` }}
                        >
                          <span className="text-sm text-foreground whitespace-nowrap">
                            🚀 Up
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          62.3%
                        </span>
                      </div>

                      {/* Down */}
                      <div className="flex items-center gap-3">
                        <div
                          className="h-10 bg-bearish/20 rounded-lg flex items-center px-2 min-w-[20px]"
                          // style={{ width: `37.7%` }}
                          style={{ width: `60%` }}
                        >
                          <span className="text-sm text-foreground whitespace-nowrap">
                            📉 Down
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          37.7%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              </div>

              {/* The Stratosphere approach */}
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Before: The Internet */}
                <div className="bg-card border border-border rounded-2xl p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-muted/50">
                      <Users className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <h4 className="text-lg font-semibold text-muted-foreground">Emotional guessing</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-background/50 rounded-lg border border-border/50">
                      <MessageCircle className="w-5 h-5 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Opinions</span>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-background/50 rounded-lg border border-border/50">
                      <Users className="w-5 h-5 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Votes</span>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-background/50 rounded-lg border border-border/50">
                      <TrendingUp className="w-5 h-5 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Emotion</span>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-background/50 rounded-lg border border-border/50">
                      <Sparkles className="w-5 h-5 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Hope</span>
                    </div>
                  </div>
                </div>

                {/* After: Stratosphere */}
                <div className="bg-primary/5 border border-primary/30 hover:shadow-glow rounded-2xl p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <BarChart3 className="w-5 h-5 text-primary" />
                    </div>
                    <h4 className="text-lg font-semibold text-foreground">STRATOSPHERE</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-background/80 rounded-lg border border-primary/20">
                      <BarChart3 className="w-5 h-5 text-primary shrink-0" />
                      <span className="text-foreground font-medium">Win rate: 62.3%</span>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-background/80 rounded-lg border border-primary/20">
                      <Search className="w-5 h-5 text-primary shrink-0" />
                      <span className="text-foreground font-medium">Risk:Reward: 1.01</span>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-background/80 rounded-lg border border-primary/20">
                      <Target className="w-5 h-5 text-primary shrink-0" />
                      <span className="text-foreground font-medium">Trades taken: 61</span>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-background/80 rounded-lg border border-primary/20">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                      <span className="text-foreground font-medium">Direction: Long</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* The result */}
              <div className="text-center space-y-6 pt-8">
                <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
                  Instead of asking the crowd, you ask history.<br />
                  <span className="text-foreground font-medium">
                    And history has receipts.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sandbox Section */}
      <section
        id="sandbox"
        className="py-24"
      >
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto m text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-4">
              <FlaskConical className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Try It Now
              </span>
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              See it for yourself
            </h2>

            <p className="text-xl text-muted-foreground mb-4 max-w-2xl mx-auto">
              The Similarity Sandbox lets you experiment with our algorithm — 
              no signup required. Build intuition before we launch.
            </p>

            <div className="bg-card border border-primary rounded-xl hover:shadow-glow rounded-2xl p-4 md:p-4">
              <div className="aspect-video bg-background rounded-xl flex items-center justify-center pb-2 pt-1 mb-4 border border-border/50">
                <img
                    src="/sandbox_demo_short.gif"
                    alt="Sandbox preview"
                    className=" h-full object-cover rounded-xl"
                  />
              </div>

              <Button
                size="sm"
                onClick={() => navigate("/sandbox")}
                className="bg-primary hover:bg-primary/90 shadow-glow
                  text-sm sm:text-base lg:text-xl
                  px-4 sm:px-6 lg:px-8
                  py-2 sm:py-3
                  h-auto
                  
                  whitespace-nowrap"
                >
                <span className="hidden sm:inline">
                  Try the Similarity Sandbox
                </span>
                <span className="sm:hidden">
                  Try Sandbox
                </span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mt-8">
              Note: The Sandbox is a demo environment. The full product will include more features and assets.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-28 md:py-40 bg-gradient-hero">
        <div className="container mx-auto px-6 mb-60">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground text-center mb-6">
              Questions?
            </h2>
            <p className="text-lg text-muted-foreground text-center mb-16">
              Here are some answers. More coming soon. <br />
              In the meantime, reach out to us on {" "}
              <a
                href="https://www.instagram.com/stratospheretrading/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent"
              >
               Instagram
              </a>
              .
            </p>
            

            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem
                value="item-1"
                className="bg-card border rounded-xl px-6 bg-card border-primary hover:shadow-glow"
              >
                <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline py-6">
                  What markets does Stratosphere support?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6">
                  Stratosphere is designed to work with multiple asset classes
                  including cryptocurrencies, forex pairs, and stocks. We're
                  continuously adding more assets and markets based on user
                  demand.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="item-2"
                className="bg-card border rounded-xl px-6 bg-card  border-primary hover:shadow-glow"
              >
                <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline py-6">
                  Is this for beginners or advanced traders?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6">
                  Both. Beginners will appreciate the visual, intuitive approach 
                  to pattern analysis. Advanced traders will value the objective, 
                  data-driven validation of their strategies.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="item-3"
                className="bg-card border rounded-xl px-6 bg-card  border-primary hover:shadow-glow"
              >
                <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline py-6">
                  When will the full product launch?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6">
                  We're currently in development with a target launch in 2026.
                  Join the waitlist to get notified and receive priority access.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="item-4"
                className="bg-card border rounded-xl px-6 bg-card  border-primary hover:shadow-glow"
              >
                <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline py-6">
                  How is this different from regular backtesting?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6">
                  Traditional backtesting requires rigid, rule-based strategies. 
                  Stratosphere uses visual pattern matching and similarity scoring, 
                  letting you test ideas based on how charts look — not just indicator values.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="item-5"
                className="bg-card border rounded-xl px-6 bg-card  border-primary hover:shadow-glow"
              >
                <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline py-6">
                  Is there a free tier?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6">
                  Pricing details will be announced closer to launch. We plan to
                  offer options for different types of traders. The Similarity
                  Sandbox is currently free to use.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

      {/* Final CTA */}
        <div className="container mx-auto px-6 mb-40">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
              Stop guessing.<br />
              <span className="text-muted-foreground">Start knowing.</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Join the waitlist and be the first to trade with evidence.
            </p>
            <Button
              size="lg"
              onClick={() => scrollToSection("waitlist")}
              className="bg-primary hover:bg-primary/90 shadow-glow text-lg px-8 py-3 h-auto"
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
                <div className="p-2 rounded-lg">
                  <img
                    src="/name_logo.png"
                    alt="Stratosphere logo"
                    className="h-8 object-contain"
                  />
                </div>
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
                  onClick={() => scrollToSection("case")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Use case
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
                  href="https://www.instagram.com/stratospheretrading/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-card/50 border border-border hover:bg-card transition-colors"
                  aria-label="Instagram"
                >
                  <FaInstagram className="w-4 h-4 text-muted-foreground hover:text-[#E4405F]" />
                </a>
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-card/50 border border-border hover:bg-card transition-colors"
                  aria-label="Linkedin"
                >
                  <FaLinkedin className="w-4 h-4 text-muted-foreground hover:text-[#0077B5]" />
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
