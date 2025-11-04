"use client";

import { useState, useEffect, useCallback } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import { useAuth } from "./auth-provider";
import { useRouter } from "next/navigation";
import type { Casino, EntryType } from "@/lib/database.types";
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
  const [allCasinos, setAllCasinos] = useState<Casino[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    logo_url: "",
    bonus: "",
    license: "",
    description: "",
    country: "",
    payment_methods: [] as string[],
    entry_type: "casino" as EntryType,
    promo_code: "",
    promo_code_expires_at: "",
    editorial_rating: "",
    external_url: "",
    verified: false,
    sister_site_of: "",
    is_featured: false,
    title: "",
    meta_description: "",
  });

  const [paymentMethodInput, setPaymentMethodInput] = useState("");

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

  const loadAllCasinos = useCallback(async () => {
    try {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from("casinos")
        .select("id, name, slug")
        .eq("entry_type", "casino")
        .order("name");

      if (error) throw error;
      
      // Combine with demo data
      const demoCasinosList = demoCasinos.filter(c => c.entry_type === "casino");
      setAllCasinos([...(data || []), ...demoCasinosList]);
    } catch (error) {
      console.error("Error loading casinos:", error);
      const demoCasinosList = demoCasinos.filter(c => c.entry_type === "casino");
      setAllCasinos(demoCasinosList);
    }
  }, []);

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
            name: demoCasino.name || "",
            slug: demoCasino.slug || generateSlug(demoCasino.name) || "",
            logo_url: demoCasino.logo_url || "",
            bonus: demoCasino.bonus || "",
            license: demoCasino.license || "",
            description: demoCasino.description || "",
            country: demoCasino.country || "",
            payment_methods: demoCasino.payment_methods || [],
            entry_type: demoCasino.entry_type || "casino",
            promo_code: demoCasino.promo_code || "",
            promo_code_expires_at: demoCasino.promo_code_expires_at ? new Date(demoCasino.promo_code_expires_at).toISOString().split('T')[0] : "",
            editorial_rating: demoCasino.editorial_rating?.toString() || "",
            external_url: demoCasino.external_url || "",
            verified: demoCasino.verified || false,
            sister_site_of: demoCasino.sister_site_of || "",
            is_featured: demoCasino.is_featured || false,
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
        name: data.name || "",
        slug: data.slug || generateSlug(data.name) || "",
        logo_url: data.logo_url || "",
        bonus: data.bonus || "",
        license: data.license || "",
        description: data.description || "",
        country: data.country || "",
        payment_methods: data.payment_methods || [],
        entry_type: data.entry_type || "casino",
        promo_code: data.promo_code || "",
        promo_code_expires_at: data.promo_code_expires_at ? new Date(data.promo_code_expires_at).toISOString().split('T')[0] : "",
        editorial_rating: data.editorial_rating?.toString() || "",
        external_url: data.external_url || "",
        verified: data.verified || false,
        sister_site_of: data.sister_site_of || "",
        is_featured: data.is_featured || false,
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
      loadAllCasinos();
      loadCasino();
    }
  }, [isAdmin, loadCasino, loadAllCasinos]);

  const handleAddPaymentMethod = () => {
    if (paymentMethodInput.trim() && !formData.payment_methods.includes(paymentMethodInput.trim())) {
      setFormData({
        ...formData,
        payment_methods: [...formData.payment_methods, paymentMethodInput.trim()],
      });
      setPaymentMethodInput("");
    }
  };

  const handleRemovePaymentMethod = (method: string) => {
    setFormData({
      ...formData,
      payment_methods: formData.payment_methods.filter(m => m !== method),
    });
  };

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

      // Prepare update data
      const updateData: any = {
        name: formData.name,
        slug: formData.slug || generateSlug(formData.name),
        logo_url: formData.logo_url,
        bonus: formData.bonus,
        license: formData.license,
        description: formData.description || null,
        country: formData.country || null,
        payment_methods: formData.payment_methods.length > 0 ? formData.payment_methods : null,
        entry_type: formData.entry_type,
        promo_code: formData.promo_code || null,
        promo_code_expires_at: formData.promo_code_expires_at ? new Date(formData.promo_code_expires_at).toISOString() : null,
        editorial_rating: formData.editorial_rating ? parseFloat(formData.editorial_rating) : null,
        external_url: formData.external_url || null,
        verified: formData.verified,
        sister_site_of: formData.sister_site_of || null,
        is_featured: formData.is_featured,
        title: formData.title || null,
        meta_description: formData.meta_description || null,
        updated_at: new Date().toISOString(),
      };

      // Update casino
      const { error: updateError } = await supabase
        .from("casinos")
        .update(updateData)
        .eq("id", casino.id);

      if (updateError) throw updateError;

      // Redirect back to casino page
      const slug = formData.slug || generateSlug(formData.name) || casino.id;
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
          {/* Basic Information */}
          <div className="space-y-4 border-b border-gray-200 dark:border-gray-700 pb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Basic Information</h2>
            
            <div>
              <label className="block text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-2">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Casino name"
                required
              />
            </div>

            <div>
              <label className="block text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-2">
                Slug (URL) *
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="casino-slug"
                required
              />
              <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                URL-friendly identifier. Leave empty to auto-generate from name.
              </p>
            </div>

            <div>
              <label className="block text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-2">
                Logo URL *
              </label>
              <input
                type="url"
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                className="w-full px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/logo.png"
                required
              />
            </div>

            <div>
              <label className="block text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-2">
                Entry Type *
              </label>
              <select
                value={formData.entry_type}
                onChange={(e) => setFormData({ ...formData, entry_type: e.target.value as EntryType })}
                className="w-full px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="casino">Casino</option>
                <option value="sister-site">Sister Site</option>
                <option value="review-site">Review Site</option>
                <option value="blog">Blog</option>
              </select>
            </div>

            <div>
              <label className="block text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-2">
                Bonus *
              </label>
              <input
                type="text"
                value={formData.bonus}
                onChange={(e) => setFormData({ ...formData, bonus: e.target.value })}
                className="w-full px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Welcome Bonus: $500 + 100 Free Spins"
                required
              />
            </div>

            <div>
              <label className="block text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-2">
                License *
              </label>
              <input
                type="text"
                value={formData.license}
                onChange={(e) => setFormData({ ...formData, license: e.target.value })}
                className="w-full px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Malta Gaming Authority"
                required
              />
            </div>

            <div>
              <label className="block text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Detailed description of the casino..."
              />
            </div>

            <div>
              <label className="block text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-2">
                Country (GEO)
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="United Kingdom"
              />
            </div>

            <div>
              <label className="block text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-2">
                Payment Methods
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={paymentMethodInput}
                  onChange={(e) => setPaymentMethodInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPaymentMethod();
                    }
                  }}
                  className="flex-1 px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Visa, Mastercard, PayPal..."
                />
                <button
                  type="button"
                  onClick={handleAddPaymentMethod}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.payment_methods.map((method, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-sm"
                  >
                    {method}
                    <button
                      type="button"
                      onClick={() => handleRemovePaymentMethod(method)}
                      className="hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Promo Code & Rating */}
          <div className="space-y-4 border-b border-gray-200 dark:border-gray-700 pb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Promo Code & Rating</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-2">
                  Promo Code
                </label>
                <input
                  type="text"
                  value={formData.promo_code}
                  onChange={(e) => setFormData({ ...formData, promo_code: e.target.value })}
                  className="w-full px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="PROMO123"
                />
              </div>

              <div>
                <label className="block text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-2">
                  Promo Code Expires At
                </label>
                <input
                  type="date"
                  value={formData.promo_code_expires_at}
                  onChange={(e) => setFormData({ ...formData, promo_code_expires_at: e.target.value })}
                  className="w-full px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-2">
                Editorial Rating (0-5)
              </label>
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={formData.editorial_rating}
                onChange={(e) => setFormData({ ...formData, editorial_rating: e.target.value })}
                className="w-full px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="4.5"
              />
            </div>
          </div>

          {/* Sister Site Specific */}
          {formData.entry_type === 'sister-site' && (
            <div className="space-y-4 border-b border-gray-200 dark:border-gray-700 pb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Sister Site Settings</h2>
              
              <div>
                <label className="block text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-2">
                  Parent Casino
                </label>
                <select
                  value={formData.sister_site_of}
                  onChange={(e) => setFormData({ ...formData, sister_site_of: e.target.value })}
                  className="w-full px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">None</option>
                  {allCasinos.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Select the parent casino this sister site belongs to.
                </p>
              </div>
            </div>
          )}

          {/* Review Site & Blog Specific */}
          {(formData.entry_type === 'review-site' || formData.entry_type === 'blog') && (
            <div className="space-y-4 border-b border-gray-200 dark:border-gray-700 pb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {formData.entry_type === 'review-site' ? 'Review Site' : 'Blog'} Settings
              </h2>
              
              <div>
                <label className="block text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-2">
                  External URL
                </label>
                <input
                  type="url"
                  value={formData.external_url}
                  onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
                  className="w-full px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com"
                />
                <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  External URL for {formData.entry_type === 'review-site' ? 'review site' : 'blog'}.
                </p>
              </div>
            </div>
          )}

          {/* SEO Fields */}
          <div className="space-y-4 border-b border-gray-200 dark:border-gray-700 pb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">SEO Settings</h2>
            
            <div>
              <label className="block text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-2">
                Title (SEO)
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
                Meta Description (SEO)
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
          </div>

          {/* Additional Settings */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Additional Settings</h2>
            
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.verified}
                  onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                  Verified
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                  Featured
                </span>
              </label>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 sm:p-4">
              <p className="text-sm sm:text-base text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <div className="flex items-center gap-4 pt-4">
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
