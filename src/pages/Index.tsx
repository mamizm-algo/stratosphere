import { Hero } from "@/components/Hero";
import { HomeHeader } from "@/components/HomeHeader";
import { HowItWorks } from "@/components/HowItWorks";
import { FeedbackSection } from "@/components/FeedbackSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <HomeHeader />
      <Hero />
      <HowItWorks />
      <FeedbackSection />
    </div>
  );
};

export default Index;
