import { Hero } from "@/components/Hero";
import { HomeHeader } from "@/components/HomeHeader";
import { HowItWorks } from "@/components/HowItWorks";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <HomeHeader />
      <Hero />
      <HowItWorks />
    </div>
  );
};

export default Index;
