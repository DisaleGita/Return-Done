import type { Metadata } from "next";
import { ReturnDetailView } from "@/components/returns/ReturnDetailView";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Return ${decodeURIComponent(id).toUpperCase()}`, robots: { index: false } };
}

export default async function ReturnPage({ params }: Props) {
  const { id } = await params;
  return <ReturnDetailView id={decodeURIComponent(id)} />;
}
