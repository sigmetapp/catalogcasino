import { CasinoDetailPage } from "@/components/casino-detail-page";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CasinoPage(props: PageProps) {
  const params = await props.params;
  return <CasinoDetailPage casinoId={params.id} />;
}
