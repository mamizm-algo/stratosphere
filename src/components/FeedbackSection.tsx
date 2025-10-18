import { Button } from "@/components/ui/button";
import { MessageSquareHeart } from "lucide-react";

export const FeedbackSection = () => {
  // Replace this URL with your actual survey form URL
  const surveyUrl = "https://forms.google.com/your-survey-link";

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-secondary to-background border border-primary/20 p-12 text-center shadow-[var(--shadow-glow)]">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
              <MessageSquareHeart className="w-8 h-8 text-primary" />
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-primary to-foreground bg-clip-text text-transparent">
              Help us improve!
            </h2>
            
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              This product is currently under development, and we're excited to share this early version with you. 
              Your feedback is invaluable in shaping the future of our platform.
            </p>
            
            <p className="text-base text-muted-foreground mb-8 max-w-2xl mx-auto">
              We'd love to hear your thoughts, ideas, and suggestions. Every response helps us build something better for you!
            </p>
            
            <Button 
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[var(--shadow-glow)] transition-all duration-300 hover:scale-105"
              asChild
            >
              <a 
                href={surveyUrl} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Share Your Feedback
              </a>
            </Button>
            
            <p className="text-sm text-muted-foreground mt-6">
              Takes less than 3 minutes • Your input matters
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
