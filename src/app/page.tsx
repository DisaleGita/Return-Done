import { Faq, FinalCta, StorySnippet } from "@/components/landing/Closing";
import { AssistantTeaser, Benefits, Pricing, Retailers } from "@/components/landing/Features";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks, Problem } from "@/components/landing/ProblemAndSteps";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Retailers />
      <Problem />
      <HowItWorks />
      <Benefits />
      <AssistantTeaser />
      <Pricing />
      <StorySnippet />
      <Faq />
      <FinalCta />
    </>
  );
}
