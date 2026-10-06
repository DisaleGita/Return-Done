import { Faq, FinalCta, StorySnippet } from "@/components/landing/Closing";
import { AssistantTeaser, Benefits, Pricing, Retailers } from "@/components/landing/Features";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks, Problem } from "@/components/landing/ProblemAndSteps";

export default function HomePage() {
  // A single wrapper element: Next.js scrolls a new page's first element into
  // view, and with a fragment it walked through the sections instead of
  // starting at the top.
  return (
    <div>
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
    </div>
  );
}
