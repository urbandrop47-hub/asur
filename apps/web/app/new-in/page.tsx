import type { Metadata } from "next";
import SmartCollectionClient from "../_components/smart-collection-client";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://weareasur.in";

export const metadata: Metadata = {
  title: "New In — ASUR",
  description: "The freshest drops — ASUR pieces added in the last 30 days.",
  alternates: { canonical: `${SITE_URL}/new-in` },
  openGraph: {
    title: "New In — ASUR",
    description: "The freshest drops — ASUR pieces added in the last 30 days.",
    url: `${SITE_URL}/new-in`,
    siteName: "ASUR",
    type: "website",
  },
};

export default function NewInPage() {
  return (
    <SmartCollectionClient
      endpoint="/api/v1/products/new-in"
      title="New In"
      eyebrow="Fresh drops"
      subtitle="Pieces added in the last 30 days — first in, first out."
      emptyMessage="No new arrivals in the last 30 days. Check back soon."
      accentColor="rgba(99,102,241,0.8)"
    />
  );
}
