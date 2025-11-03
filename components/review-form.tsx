"use client";

import { useState } from "react";
import { RatingStars } from "./rating-stars";
import { createSupabaseClient } from "@/lib/supabase";
import { useAuth } from "./auth-provider";
import { useRouter } from "next/navigation";

interface ReviewFormProps {
  casinoId: string;
  onSuccess?: () => void;
}

export function ReviewForm({ casinoId, onSuccess }: ReviewFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [username, setUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-blue-800 dark:text-blue-200">
          Please sign in to leave a review.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    if (!comment.trim()) {
      setError("Please write a comment");
      return;
    }

    if (!username.trim()) {
      setError("Please enter your name");
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createSupabaseClient();

      // Insert review
      const { error: reviewError } = await supabase.from("reviews").insert({
        casino_id: casinoId,
        user_id: user.id,
        username: username.trim(),
        rating,
        comment: comment.trim(),
      });

      if (reviewError) throw reviewError;

      // Update casino rating
      const { data: reviews } = await supabase
        .from("reviews")
        .select("rating")
        .eq("casino_id", casinoId);

      if (reviews) {
        const avgRating =
          reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

        await supabase
          .from("casinos")
          .update({
            rating_avg: avgRating,
            rating_count: reviews.length,
          })
          .eq("id", casinoId);
      }

      setComment("");
      setRating(0);
      setUsername("");

      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Your Name
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter your name"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Rating
        </label>
        <RatingStars
          rating={rating}
          interactive
          onRatingChange={setRating}
        />
        {rating === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Click stars to rate
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Your Review
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Share your experience..."
          required
        />
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
      >
        {submitting ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}
