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
    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between gap-2 sm:gap-4 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
            <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
              {review.username}
            </h4>
            <RatingStars rating={review.rating} size={14} />
            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {formatDate(review.created_at)}
            </span>
          </div>
          <p className="text-sm sm:text-base text-gray-700 dark:text-gray-200 break-words">{review.comment}</p>
        </div>
        {canDelete && onDelete && (
          <button
            onClick={onDelete}
            className="ml-2 sm:ml-4 p-1.5 sm:p-2 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors flex-shrink-0"
            aria-label="Delete review"
          >
            <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        )}
      </div>
    </div>
  );
}
