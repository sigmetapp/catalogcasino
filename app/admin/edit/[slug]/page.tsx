import { EditCasinoPage } from "@/components/edit-casino-page";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditCasino(props: PageProps) {
  const params = await props.params;
  return <EditCasinoPage casinoSlug={params.slug} />;
}
