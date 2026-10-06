import type { Metadata } from "next";
import { Suspense } from "react";
import { ScheduleWizard } from "@/components/schedule/ScheduleWizard";

export const metadata: Metadata = {
  title: "Schedule a Return",
  description: "Tell us what you're returning and pick a doorstep pickup window.",
};

export default function SchedulePage() {
  return (
    <div className="container" style={{ paddingBottom: "var(--space-8)" }}>
      {/* useSearchParams (assistant hand-off) needs a Suspense boundary. */}
      <Suspense>
        <ScheduleWizard />
      </Suspense>
    </div>
  );
}
