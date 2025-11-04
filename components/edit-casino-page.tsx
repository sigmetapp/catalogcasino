"use client";

import { useState, useEffect, useCallback } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import { useAuth } from "./auth-provider";
import { useRouter } from "next/navigation";
import type { Casino } from "@/lib/database.types";
import { generateSlug } from "@/lib/utils";
import { demoCasinos } from "@/lib/demo-data";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

interface EditCasinoPageProps {
  casinoSlug: string;
}

export function EditCasinoPage({ casinoSlug }: EditCasinoPageProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [casino, setCasino] = useState<Casino | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    meta_description: "",
  });

  useEffect(() => {
    async function checkAdmin() {
      if (user) {
        try {
          const supabase = createSupabaseClient();
          const { data } = await supabase
            .from("users")
            .select("is_admin")
            .eq("id", user.id)
            .single();
          setIsAdmin(data?.is_admin ?? false);
          if (!data?.is_admin) {
            setError("Access denied. Admin privileges required.");
            setLoading(false);
          }
        } catch (error) {
          console.error("Failed to check admin status:", error);
          setError("Failed to verify admin status");
          setLoading(false);
        }
      } else {
        setError("Please sign in to edit");
        setLoading(false);
      }
    }
    checkAdmin();
  }, [user]);

  const loadCasino = useCallback(async () => {
    if (!isAdmin) return;

    try {
      const supabase = createSupabaseClient();
      
      // Try to find by slug first
      let { data, error } = await supabase
        .from("casinos")
        .select("*")
        .eq("slug", casinoSlug)
        .single();

      // If not found by slug, try by id
      if (error && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(casinoSlug)) {
        const { data: dataById, error: errorById } = await supabase
          .from("casinos")
          .select("*")
          .eq("id", casinoSlug)
          .single();
        
        if (!errorById && dataById) {
          data = dataById;
          error = null;
        }
      }

      // If still not found, try demo data
      if (error || !data) {
        const demoCasino = demoCasinos.find(c => 
          c.slug === casinoSlug || 
          generateSlug(c.name) === casinoSlug ||
          c.id === casinoSlug
        );

        if (demoCasino) {
          setCasino(demoCasino);
          setFormData({
            title: demoCasino.title || "",
            meta_description: demoCasino.meta_description || "",
          });
          setLoading(false);
          return;
        }

        setError("Casino not found");
        setLoading(false);
        return;
      }

      setCasino(data);
      setFormData({
        title: data.title || "",
        meta_description: data.meta_description || "",
      });
    } catch (err: any) {
      console.error("Error loading casino:", err);
      setError(err.message || "Failed to load casino");
    } finally {
      setLoading(false);
    }
  }, [casinoSlug, isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      loadCasino();
    }
  }, [isAdmin, loadCasino]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    if (!casino || !user) {
      setError("Invalid data");
      setSaving(false);
      return;
    }

    try {
      const supabase = createSupabaseClient();
      
      // Check admin status again
      const { data: userData } = await supabase
        .from("users")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (!userData?.is_admin) {
        setError("Access denied. Admin privileges required.");
        setSaving(false);
        return;
      }

      // Update casino
      const { error: updateError } = await supabase
        .from("casinos")
        .update({
          title: formData.title || null,
          meta_description: formData.meta_description || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", casino.id);

      if (updateError) throw updateError;

      // Redirect back to casino page
      const slug = casino.slug || generateSlug(casino.name) || casino.id;
      router.push(`/casino/${slug}`);
    } catch (err: any) {
      console.error("Error updating casino:", err);
      setError(err.message || "Failed to update casino");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-200">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !casino) {
    return (
      <div className="text-center py-8 sm:py-12 px-4">
        <p className="text-red-600 dark:text-red-400 text-base sm:text-lg mb-4">
          {error}
        </p>
        <button
          onClick={() => router.back()}
          className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!casino) {
    return (
      <div className="text-center py-8 sm:py-12 px-4">
        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-200 mb-4">
          Casino not found
        </p>
        <button
          onClick={() => router.back()}
          className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
        >
          Go Back
        </button>
      </div>
    );
  }

  const slug = casino.slug || generateSlug(casino.name) || casino.id;

  return (
    <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push(`/casino/${slug}`)}
          className="text-sm sm:text-base text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2"
        >
          <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
          Back to Page
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-4 sm:p-6 md:p-8 border border-gray-200 dark:border-gray-800">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Edit: {casino.name}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-2">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Page title (for SEO)"
              maxLength={200}
            />
            <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              This will be used as the page title for SEO purposes. Leave empty to use default.
            </p>
          </div>

          <div>
            <label className="block text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-2">
              Meta Description
            </label>
            <textarea
              value={formData.meta_description}
              onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Meta description for SEO (recommended: 150-160 characters)"
              maxLength={300}
            />
            <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              {formData.meta_description.length}/300 characters. This will be used as the meta description for SEO.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 sm:p-4">
              <p className="text-sm sm:text-base text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm sm:text-base"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 sm:h-5 sm:w-5" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} className="sm:w-5 sm:h-5" />
                  Save Changes
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.push(`/casino/${slug}`)}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium text-sm sm:text-base"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
