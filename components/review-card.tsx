"use client";

import { RatingStars } from "./rating-stars";
import { formatDate } from "@/lib/utils";
import type { Review } from "@/lib/database.types";
import { Trash2 } from "lucide-react";
import { useAuth } from "./auth-provider";
import { useState, useEffect } from "react";
import { createSupabaseClient } from "@/lib/supabase";

interface ReviewCardProps {
  review: Review;
  onDelete?: () => void;
  showDelete?: boolean;
}

export function ReviewCard({ review, onDelete, showDelete = false }: ReviewCardProps) {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      if (user) {
        const supabase = createSupabaseClient();
        const { data } = await supabase
          .from("users")
          .select("is_admin")
          .eq("id", user.id)
          .single();
        setIsAdmin(data?.is_admin ?? false);
      }
    }
    checkAdmin();
  }, [user]);

  const canDelete = showDelete && (isAdmin || user?.id === review.user_id);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              {review.username}
            </h4>
            <RatingStars rating={review.rating} size={16} />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(review.created_at)}
            </span>
          </div>
          <p className="text-gray-700 dark:text-gray-300">{review.comment}</p>
        </div>
        {canDelete && onDelete && (
          <button
            onClick={onDelete}
            className="ml-4 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
            aria-label="Delete review"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
