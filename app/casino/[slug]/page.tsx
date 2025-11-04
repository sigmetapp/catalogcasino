import { CasinoDetailPage } from "@/components/casino-detail-page";
import { notFound } from "next/navigation";
import { generateMetadata } from "./metadata";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export { generateMetadata };

export default async function CasinoPage(props: PageProps) {
  const params = await props.params;
  return <CasinoDetailPage casinoSlug={params.slug} />;
}
