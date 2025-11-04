import { Metadata } from "next";
import { generateSlug } from "@/lib/utils";
import { demoCasinos } from "@/lib/demo-data";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    // For now, use demo data since we can't use server-side Supabase in metadata
    // In production, you might want to use a different approach
    const demoCasino = demoCasinos.find(c => 
      c.slug === slug || 
      generateSlug(c.name) === slug ||
      c.id === slug
    );
    
    if (demoCasino) {
      return {
        title: demoCasino.title || `${demoCasino.name} | Casino Directory`,
        description: demoCasino.meta_description || demoCasino.description || `Information about ${demoCasino.name}`,
      };
    }
  } catch (error) {
    console.error("Error generating metadata:", error);
  }

  return {
    title: "Casino | Casino Directory",
    description: "Casino information",
  };
}
