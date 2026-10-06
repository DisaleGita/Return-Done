import type { Metadata } from "next";
import { DashboardView } from "@/components/returns/DashboardView";

export const metadata: Metadata = {
  title: "Your Returns",
  description: "Track every return and refund in one place.",
};

export default function DashboardPage() {
  return <DashboardView />;
}
