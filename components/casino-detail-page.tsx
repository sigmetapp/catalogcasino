"use client";

import { useState, useEffect } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import type { Casino, Review } from "@/lib/database.types";
import Image from "next/image";
import { RatingStars } from "./rating-stars";
import { ReviewForm } from "./review-form";
import { ReviewCard } from "./review-card";
import { formatDate, getRatingStars } from "@/lib/utils";
import { Star, CreditCard, Shield, Globe } from "lucide-react";
import { useRouter } from "next/navigation";

interface CasinoDetailPageProps {
  casinoId: string;
}

export function CasinoDetailPage({ casinoId }: CasinoDetailPageProps) {
  const [casino, setCasino] = useState<Casino | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadCasino();
    loadReviews();
  }, [casinoId]);

  async function loadCasino() {
    try {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from("casinos")
        .select("*")
        .eq("id", casinoId)
        .single();

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
  }

  async function loadReviews() {
    try {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("casino_id", casinoId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (err: any) {
      console.error("Error loading reviews:", err);
    }
  }

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading casino...</p>
        </div>
      </div>
    );
  }

  if (error || !casino) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400 text-lg mb-4">
          {error || "Casino not found"}
        </p>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go Back Home
        </button>
      </div>
    );
  }

  const stars = getRatingStars(casino.rating_avg);

  return (
    <div className="space-y-8">
      <button
        onClick={() => router.back()}
        className="text-blue-600 dark:text-blue-400 hover:underline mb-4"
      >
        ← Back
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-shrink-0">
            <Image
              src={casino.logo_url || "/placeholder-logo.svg"}
              alt={casino.name}
              width={200}
              height={200}
              className="rounded-lg object-contain bg-gray-100 dark:bg-gray-700 p-4"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder-logo.svg";
              }}
            />
          </div>

          <div className="flex-1">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {casino.name}
            </h1>

            <div className="flex items-center gap-2 mb-4">
              {stars.map((star, index) => (
                <Star
                  key={index}
                  size={24}
                  className={
                    star === 1
                      ? "fill-yellow-400 text-yellow-400"
                      : star === 0.5
                      ? "fill-yellow-400/50 text-yellow-400"
                      : "text-gray-300 dark:text-gray-600"
                  }
                />
              ))}
              <span className="ml-2 text-lg text-gray-600 dark:text-gray-400">
                {casino.rating_avg.toFixed(1)} ({casino.rating_count} reviews)
              </span>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <Star size={20} className="text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Bonus</p>
                  <p className="text-gray-700 dark:text-gray-300">{casino.bonus}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Shield size={20} className="text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">License</p>
                  <p className="text-gray-700 dark:text-gray-300">{casino.license}</p>
                </div>
              </div>

              {casino.country && (
                <div className="flex items-start gap-3">
                  <Globe size={20} className="text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Country</p>
                    <p className="text-gray-700 dark:text-gray-300">{casino.country}</p>
                  </div>
                </div>
              )}

              {casino.payment_methods && casino.payment_methods.length > 0 && (
                <div className="flex items-start gap-3">
                  <CreditCard size={20} className="text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Payment Methods</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {casino.payment_methods.map((method, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-sm"
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
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
                <p className="text-gray-700 dark:text-gray-300">{casino.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Leave a Review
        </h2>
        <ReviewForm casinoId={casinoId} onSuccess={loadReviews} />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Reviews ({reviews.length})
        </h2>

        {reviews.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400 text-center py-8">
            No reviews yet. Be the first to review this casino!
          </p>
        ) : (
          <div className="space-y-4">
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
    </div>
  );
}
