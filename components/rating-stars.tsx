"use client";

import { Star } from "lucide-react";
import { useState } from "react";

interface RatingStarsProps {
  rating: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  size?: number;
}

export function RatingStars({
  rating,
  interactive = false,
  onRatingChange,
  size = 20,
}: RatingStarsProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const displayRating = hoverRating ?? rating;

  const handleClick = (value: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(value);
    }
  };

  const handleMouseEnter = (value: number) => {
    if (interactive) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(null);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => {
        const value = i + 1;
        const filled = value <= displayRating;
        
        return (
          <Star
            key={i}
            size={size}
            className={
              filled
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300 dark:text-gray-600"
            }
            onClick={() => handleClick(value)}
            onMouseEnter={() => handleMouseEnter(value)}
            onMouseLeave={handleMouseLeave}
            style={interactive ? { cursor: "pointer" } : {}}
          />
        );
      })}
    </div>
  );
}
