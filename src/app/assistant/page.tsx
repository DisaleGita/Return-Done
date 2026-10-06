import type { Metadata } from "next";
import { AssistantView } from "@/components/assistant/AssistantView";

export const metadata: Metadata = {
  title: "Smart Return Assistant",
  description: "Paste a return email or policy and get the deadline, method and next step.",
};

export default function AssistantPage() {
  return <AssistantView />;
}
