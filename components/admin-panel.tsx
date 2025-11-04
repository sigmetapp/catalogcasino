"use client";

import { useState, useEffect } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import type { Casino, Review } from "@/lib/database.types";
import { generateSlug } from "@/lib/utils";
import { Plus, Edit, Trash2, Star, MessageSquare } from "lucide-react";

export function AdminPanel() {
  const [casinos, setCasinos] = useState<Casino[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"casinos" | "reviews">("casinos");
  const [showCasinoForm, setShowCasinoForm] = useState(false);
  const [editingCasino, setEditingCasino] = useState<Casino | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    async function doLoad() {
      try {
        setError(null);
        setLoading(true);
        // Load both casinos and reviews in parallel
        await Promise.all([loadCasinos(), loadReviews()]);
      } catch (err) {
        console.error("Error loading data:", err);
        if (isMounted) {
          setError("Failed to load data. Please refresh the page.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    
    doLoad();
    
    // Fallback timeout - if loading takes too long, stop loading
    const timeout = setTimeout(() => {
      if (isMounted) {
        console.warn("Loading timeout - stopping loading state");
        setLoading(false);
        setError("Loading is taking too long. Please refresh the page.");
      }
    }, 10000); // 10 seconds timeout

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, []);


  async function loadCasinos() {
    try {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from("casinos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCasinos(data || []);
    } catch (error) {
      console.error("Error loading casinos:", error);
      throw error;
    }
  }

  async function loadReviews() {
    try {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error("Error loading reviews:", error);
      throw error;
    }
  }

  async function handleDeleteCasino(id: string) {
    if (!confirm("Are you sure you want to delete this casino?")) return;

    try {
      const supabase = createSupabaseClient();
      const { error } = await supabase.from("casinos").delete().eq("id", id);

      if (error) throw error;
      await loadCasinos();
    } catch (error) {
      console.error("Error deleting casino:", error);
      alert("Failed to delete casino");
    }
  }

  async function handleDeleteReview(id: string) {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      const supabase = createSupabaseClient();
      const { error } = await supabase.from("reviews").delete().eq("id", id);

      if (error) throw error;

      // Update casino ratings
      const deletedReview = reviews.find((r) => r.id === id);
      if (deletedReview) {
        const { data: casinoReviews } = await supabase
          .from("reviews")
          .select("rating")
          .eq("casino_id", deletedReview.casino_id);

        if (casinoReviews && casinoReviews.length > 0) {
          const avgRating =
            casinoReviews.reduce((sum, r) => sum + r.rating, 0) /
            casinoReviews.length;

          await supabase
            .from("casinos")
            .update({
              rating_avg: avgRating,
              rating_count: casinoReviews.length,
            })
            .eq("id", deletedReview.casino_id);
        } else {
          await supabase
            .from("casinos")
            .update({
              rating_avg: 0,
              rating_count: 0,
            })
            .eq("id", deletedReview.casino_id);
        }
      }

      await loadReviews();
      await loadCasinos();
    } catch (error) {
      console.error("Error deleting review:", error);
      alert("Failed to delete review");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-200">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-red-800 dark:text-red-200">{error}</p>
          <button
            onClick={() => {
              window.location.reload();
            }}
            className="mt-2 text-xs sm:text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            Try again
          </button>
        </div>
      )}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Admin Panel
        </h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("casinos")}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
              activeTab === "casinos"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            }`}
          >
            Casinos ({casinos.length})
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
              activeTab === "reviews"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            }`}
          >
            Reviews ({reviews.length})
          </button>
        </div>
      </div>

      {activeTab === "casinos" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditingCasino(null);
                setShowCasinoForm(true);
              }}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              <Plus size={18} className="sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Add Casino</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>

          {showCasinoForm && (
            <CasinoForm
              casino={editingCasino}
              onClose={() => {
                setShowCasinoForm(false);
                setEditingCasino(null);
              }}
              onSuccess={() => {
                setShowCasinoForm(false);
                setEditingCasino(null);
                loadCasinos();
              }}
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {casinos.map((casino) => (
              <div
                key={casino.id}
                className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-4 sm:p-6 border border-gray-200 dark:border-gray-800"
              >
                <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex-1 min-w-0 break-words">
                    {casino.name}
                  </h3>
                  <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        setEditingCasino(casino);
                        setShowCasinoForm(true);
                      }}
                      className="p-1.5 sm:p-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                    >
                      <Edit size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </button>
                    <button
                      onClick={() => handleDeleteCasino(casino.id)}
                      className="p-1.5 sm:p-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    >
                      <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-xs sm:text-sm text-gray-600 dark:text-gray-200">
                  <p>
                    <span className="font-semibold">License:</span> {casino.license}
                  </p>
                  <p>
                    <span className="font-semibold">Bonus:</span> {casino.bonus}
                  </p>
                  <div className="flex items-center gap-2">
                    <Star size={14} className="sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
                    <span>
                      {casino.rating_avg.toFixed(1)} ({casino.rating_count} reviews)
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "reviews" && (
        <div className="space-y-3 sm:space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-4 sm:p-6 border border-gray-200 dark:border-gray-800"
            >
              <div className="flex items-start justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                    <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                      {review.username}
                    </h4>
                    <div className="flex gap-0.5 sm:gap-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={`sm:w-4 sm:h-4 ${
                            i < review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300 dark:text-gray-600"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm sm:text-base text-gray-700 dark:text-gray-200 mb-2 break-words">
                    {review.comment}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-300 break-all">
                    Casino ID: {review.casino_id}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteReview(review.id)}
                  className="ml-2 sm:ml-4 p-1.5 sm:p-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors flex-shrink-0"
                >
                  <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CasinoForm({
  casino,
  onClose,
  onSuccess,
}: {
  casino: Casino | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: casino?.name || "",
    logo_url: casino?.logo_url || "",
    bonus: casino?.bonus || "",
    license: casino?.license || "",
    description: casino?.description || "",
    country: casino?.country || "",
    payment_methods: casino?.payment_methods?.join(", ") || "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const supabase = createSupabaseClient();
      const paymentMethods = formData.payment_methods
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean);

      const casinoData = {
        name: formData.name,
        slug: generateSlug(formData.name),
        logo_url: formData.logo_url,
        bonus: formData.bonus,
        license: formData.license,
        description: formData.description || null,
        country: formData.country || null,
        payment_methods: paymentMethods.length > 0 ? paymentMethods : null,
      };

      if (casino) {
        // When editing, only update slug if name changed
        if (casino.name !== formData.name) {
          casinoData.slug = generateSlug(formData.name);
        } else {
          delete (casinoData as any).slug; // Keep existing slug if name unchanged
        }
        
        const { error } = await supabase
          .from("casinos")
          .update(casinoData)
          .eq("id", casino.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("casinos").insert(casinoData);

        if (error) throw error;
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to save casino");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-4 sm:p-6 border border-gray-200 dark:border-gray-800">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
        {casino ? "Edit Casino" : "Add Casino"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Logo URL *
          </label>
          <input
            type="url"
            value={formData.logo_url}
            onChange={(e) =>
              setFormData({ ...formData, logo_url: e.target.value })
            }
            className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Bonus *
          </label>
          <input
            type="text"
            value={formData.bonus}
            onChange={(e) =>
              setFormData({ ...formData, bonus: e.target.value })
            }
            className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            License *
          </label>
          <input
            type="text"
            value={formData.license}
            onChange={(e) =>
              setFormData({ ...formData, license: e.target.value })
            }
            className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Country
          </label>
          <input
            type="text"
            value={formData.country}
            onChange={(e) =>
              setFormData({ ...formData, country: e.target.value })
            }
            className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Payment Methods (comma-separated)
          </label>
          <input
            type="text"
            value={formData.payment_methods}
            onChange={(e) =>
              setFormData({ ...formData, payment_methods: e.target.value })
            }
            className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Visa, Mastercard, PayPal"
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={4}
            className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-xs sm:text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm sm:text-base"
          >
            {submitting ? "Saving..." : casino ? "Update" : "Create"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium text-sm sm:text-base"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
