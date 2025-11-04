"use client";

import { useState, useEffect, useCallback } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import type { Casino, Review } from "@/lib/database.types";
import Image from "next/image";
import { RatingStars } from "./rating-stars";
import { ReviewForm } from "./review-form";
import { ReviewCard } from "./review-card";
import { formatDate, getRatingStars, generateSlug } from "@/lib/utils";
import { Star, CreditCard, Shield, Globe, CheckCircle, ExternalLink, Ticket, Sparkles, Copy } from "lucide-react";
import { useRouter } from "next/navigation";

const getEntryTypeLabel = (type?: string) => {
  switch (type) {
    case 'sister-site': return 'Sister Site';
    case 'blog': return 'Blog';
    case 'review-site': return 'Review Site';
    default: return 'Casino';
  }
};

const getEntryTypeColor = (type?: string) => {
  switch (type) {
    case 'sister-site': return 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200';
    case 'blog': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
    case 'review-site': return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200';
    default: return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
  }
};

interface CasinoDetailPageProps {
  casinoSlug: string;
}

export function CasinoDetailPage({ casinoSlug }: CasinoDetailPageProps) {
  const [casino, setCasino] = useState<Casino | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const loadCasino = useCallback(async () => {
    try {
      const supabase = createSupabaseClient();
      
      // Try to find by slug first
      let { data, error } = await supabase
        .from("casinos")
        .select("*")
        .eq("slug", casinoSlug)
        .single();

      // If not found by slug, try by id (for backward compatibility with UUIDs)
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

      // If still not found, try to find by matching generated slug from name
      // This handles cases where slug might be null in DB but we have a generated slug
      if (error) {
        const { data: allCasinos, error: fetchError } = await supabase
          .from("casinos")
          .select("*");

        if (!fetchError && allCasinos) {
          const matchingCasino = allCasinos.find(casino => {
            const generatedSlug = generateSlug(casino.name);
            return generatedSlug === casinoSlug || casino.id === casinoSlug;
          });

          if (matchingCasino) {
            data = matchingCasino;
            error = null;
          }
        }
      }

      if (error) throw error;
      if (!data) {
        setError("Casino not found");
        return;
      }
      setCasino(data);
    } catch (err: any) {
      console.error("Error loading casino:", err);
      setError(err.message || "Failed to load casino");
    } finally {
      setLoading(false);
    }
  }, [casinoSlug]);

  const loadReviews = useCallback(async () => {
    if (!casino) return;
    
    try {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("casino_id", casino.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (err: any) {
      console.error("Error loading reviews:", err);
    }
  }, [casino]);

  useEffect(() => {
    loadCasino();
  }, [loadCasino]);

  useEffect(() => {
    if (casino) {
      loadReviews();
    }
  }, [casino, loadReviews]);

  async function handleReviewDeleted() {
    await loadReviews();
    if (casino) {
      await loadCasino();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-200">Loading casino...</p>
        </div>
      </div>
    );
  }

  if (error || !casino) {
    return (
      <div className="text-center py-8 sm:py-12 px-4">
        <p className="text-red-600 dark:text-red-400 text-base sm:text-lg mb-4">
          {error || "Casino not found"}
        </p>
        <button
          onClick={() => router.push("/")}
          className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
        >
          Go Back Home
        </button>
      </div>
    );
  }

  const stars = getRatingStars(casino.rating_avg);
  const editorialStars = casino.editorial_rating ? getRatingStars(casino.editorial_rating) : null;
  
  // Check if promo code is valid (not expired)
  const isPromoValid = casino.promo_code && (
    !casino.promo_code_expires_at || 
    new Date(casino.promo_code_expires_at) > new Date()
  );
  
  // Only blogs use external links if external_url is provided
  const isExternal = casino.entry_type === 'blog' && casino.external_url;
  const isCasino = casino.entry_type === 'casino' || !casino.entry_type;

  const copyPromoCode = () => {
    if (casino.promo_code) {
      navigator.clipboard.writeText(casino.promo_code);
      // You could add a toast notification here
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <button
        onClick={() => router.back()}
        className="text-sm sm:text-base text-blue-600 dark:text-blue-400 hover:underline mb-2 sm:mb-4"
      >
        ← Back
      </button>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-4 sm:p-6 md:p-8 border border-gray-200 dark:border-gray-800">
        <div className="flex flex-col md:flex-row gap-4 sm:gap-6 md:gap-8">
          <div className="flex-shrink-0 relative mx-auto md:mx-0">
            {casino.is_featured && (
              <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 z-10">
                <Sparkles size={20} className="sm:w-6 sm:h-6 text-yellow-500 fill-yellow-500" />
              </div>
            )}
            <Image
              src={casino.logo_url || "/placeholder-logo.svg"}
              alt={casino.name}
              width={200}
              height={200}
              className="rounded-lg object-contain bg-gray-100 dark:bg-gray-700 p-3 sm:p-4 w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48"
              unoptimized={!casino.logo_url || !casino.logo_url.startsWith('/')}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.src.includes("placeholder-logo.svg")) {
                  target.src = "/placeholder-logo.svg";
                }
              }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white break-words">
                {casino.name}
              </h1>
              {casino.verified && (
                <span title="Verified" className="flex-shrink-0">
                  <CheckCircle size={20} className="sm:w-6 sm:h-6 text-green-500" aria-label="Verified" />
                </span>
              )}
              {isExternal && casino.entry_type === 'blog' && (
                <ExternalLink size={18} className="sm:w-5 sm:h-5 text-gray-400 dark:text-gray-400 flex-shrink-0" />
              )}
            </div>

            <div className="flex items-center gap-2 mb-3 sm:mb-4 flex-wrap">
              <span className={`px-2 sm:px-3 py-1 ${getEntryTypeColor(casino.entry_type)} rounded text-xs sm:text-sm font-medium`}>
                {getEntryTypeLabel(casino.entry_type)}
              </span>
              {casino.is_featured && (
                <span className="px-2 sm:px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded text-xs sm:text-sm font-medium">
                  Featured
                </span>
              )}
            </div>

            {/* Ratings */}
            <div className="space-y-2 mb-3 sm:mb-4">
              {editorialStars && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Star size={18} className="sm:w-5 sm:h-5 text-blue-500 fill-blue-500 flex-shrink-0" />
                  <span className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-white">
                    Editorial Rating: {casino.editorial_rating?.toFixed(1)}/5.0
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                {stars.map((star, index) => (
                  <Star
                    key={index}
                    size={20}
                    className={`sm:w-6 sm:h-6 flex-shrink-0 ${
                      star === 1
                        ? "fill-yellow-400 text-yellow-400"
                        : star === 0.5
                        ? "fill-yellow-400/50 text-yellow-400"
                        : "text-gray-300 dark:text-gray-500"
                    }`}
                  />
                ))}
                <span className="ml-1 sm:ml-2 text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-200">
                  User Rating: {casino.rating_avg.toFixed(1)}/5.0 ({casino.rating_count} reviews)
                </span>
              </div>
            </div>

            {/* Promo Code */}
            {isPromoValid && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <Ticket size={20} className="sm:w-6 sm:h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">Exclusive Promo Code</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <code className="px-2 sm:px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded font-mono text-sm sm:text-base md:text-lg font-bold break-all">
                          {casino.promo_code}
                        </code>
                        <button
                          onClick={copyPromoCode}
                          className="p-1.5 sm:p-2 hover:bg-green-100 dark:hover:bg-green-900 rounded transition-colors flex-shrink-0"
                          aria-label="Copy promo code"
                          title="Copy promo code"
                        >
                          <Copy size={16} className="sm:w-[18px] sm:h-[18px] text-green-600 dark:text-green-400" />
                        </button>
                      </div>
                      {casino.promo_code_expires_at && (
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                          Expires: {formatDate(casino.promo_code_expires_at)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* External URL button - only for blogs */}
            {isExternal && casino.external_url && (
              <div className="mb-4 sm:mb-6">
                <a
                  href={casino.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                >
                  <ExternalLink size={18} className="sm:w-5 sm:h-5" />
                  Visit Site
                </a>
              </div>
            )}

            <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
              <div className="flex items-start gap-2 sm:gap-3">
                <Star size={18} className="sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 mt-0.5 sm:mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">Bonus</p>
                  <p className="text-sm sm:text-base text-gray-700 dark:text-gray-200 break-words">{casino.bonus}</p>
                </div>
              </div>

              <div className="flex items-start gap-2 sm:gap-3">
                <Shield size={18} className="sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 mt-0.5 sm:mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">License</p>
                  <p className="text-sm sm:text-base text-gray-700 dark:text-gray-200 break-words">{casino.license}</p>
                </div>
              </div>

              {casino.country && (
                <div className="flex items-start gap-2 sm:gap-3">
                  <Globe size={18} className="sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 mt-0.5 sm:mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">Country</p>
                    <p className="text-sm sm:text-base text-gray-700 dark:text-gray-200">{casino.country}</p>
                  </div>
                </div>
              )}

              {casino.payment_methods && casino.payment_methods.length > 0 && (
                <div className="flex items-start gap-2 sm:gap-3">
                  <CreditCard size={18} className="sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 mt-0.5 sm:mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">Payment Methods</p>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {casino.payment_methods.map((method, index) => (
                        <span
                          key={index}
                          className="px-2 sm:px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs sm:text-sm"
                        >
                          {method}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {casino.description && (
              <div className="mb-4 sm:mb-6">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-200 leading-relaxed">{casino.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {isCasino && (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-4 sm:p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
            Leave a Review
          </h2>
          <ReviewForm casinoId={casino.id} onSuccess={loadReviews} />
        </div>
      )}

      {isCasino && (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-4 sm:p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
            Reviews ({reviews.length})
          </h2>

          {reviews.length === 0 ? (
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-200 text-center py-6 sm:py-8">
              No reviews yet. Be the first to review this {getEntryTypeLabel(casino.entry_type).toLowerCase()}!
            </p>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onDelete={handleReviewDeleted}
                  showDelete={true}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
