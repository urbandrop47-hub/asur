import type { Metadata } from "next";
import SmartCollectionClient from "../_components/smart-collection-client";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://weareasur.in";

export const metadata: Metadata = {
  title: "Bestsellers — ASUR",
  description: "The pieces that move — ASUR's most-purchased drops of the month.",
  alternates: { canonical: `${SITE_URL}/bestsellers` },
  openGraph: {
    title: "Bestsellers — ASUR",
    description: "The pieces that move — ASUR's most-purchased drops of the month.",
    url: `${SITE_URL}/bestsellers`,
    siteName: "ASUR",
    type: "website",
  },
};

export default function BestsellersPage() {
  return (
    <SmartCollectionClient
      endpoint="/api/v1/products/bestsellers"
      title="Bestsellers"
      eyebrow="Most wanted"
      subtitle="Ranked by units sold in the last 30 days."
      emptyMessage="No sales data yet. Check back after the first drop."
      accentColor="rgba(249,115,22,0.8)"
      showRank
    />
  );
}
