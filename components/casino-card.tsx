"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, CheckCircle, ExternalLink, Ticket, Sparkles } from "lucide-react";
import type { Casino } from "@/lib/database.types";
import { getRatingStars, generateSlug } from "@/lib/utils";

interface CasinoCardProps {
  casino: Casino;
}

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

export function CasinoCard({ casino }: CasinoCardProps) {
  const stars = getRatingStars(casino.rating_avg);
  const editorialStars = casino.editorial_rating ? getRatingStars(casino.editorial_rating) : null;
  
  // Fallback: use slug if available, otherwise generate from name, otherwise use id
  const slug = casino.slug || generateSlug(casino.name) || casino.id;
  
  // Check if promo code is valid (not expired)
  const isPromoValid = casino.promo_code && (
    !casino.promo_code_expires_at || 
    new Date(casino.promo_code_expires_at) > new Date()
  );
  
  // Use external URL for blogs/review sites, otherwise use internal link
  const href = (casino.entry_type === 'blog' || casino.entry_type === 'review-site') && casino.external_url
    ? casino.external_url
    : `/casino/${slug}`;
  
  const isExternal = (casino.entry_type === 'blog' || casino.entry_type === 'review-site') && casino.external_url;

  const CardContent = (
    <div className="p-4 sm:p-6">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="flex-shrink-0 relative">
          {casino.is_featured && (
            <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 z-10">
              <Sparkles size={16} className="sm:w-5 sm:h-5 text-yellow-500 fill-yellow-500" />
            </div>
          )}
          <Image
            src={casino.logo_url || "/placeholder-logo.svg"}
            alt={casino.name}
            width={80}
            height={80}
            className="rounded-lg object-contain w-16 h-16 sm:w-20 sm:h-20"
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
          <div className="flex items-center gap-1.5 sm:gap-2 mb-2 flex-wrap">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate flex-1 min-w-0">
              {casino.name}
            </h3>
            {casino.verified && (
              <span title="Verified" className="flex-shrink-0">
                <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px] text-green-500" aria-label="Verified" />
              </span>
            )}
            {isExternal && (
              <ExternalLink size={14} className="sm:w-4 sm:h-4 text-gray-400 dark:text-gray-400 flex-shrink-0" />
            )}
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-2 mb-2 flex-wrap">
            <span className={`text-xs px-2 py-1 ${getEntryTypeColor(casino.entry_type)} rounded`}>
              {getEntryTypeLabel(casino.entry_type)}
            </span>
            {casino.is_featured && (
              <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded">
                Featured
              </span>
            )}
          </div>
          
          {/* Ratings */}
          <div className="mb-2 space-y-1">
            {editorialStars && (
              <div className="flex items-center gap-1 flex-wrap">
                <Star size={12} className="sm:w-3.5 sm:h-3.5 text-blue-500 fill-blue-500 flex-shrink-0" />
                <span className="text-xs text-gray-600 dark:text-gray-200">
                  Editorial: {casino.editorial_rating?.toFixed(1)}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1 flex-wrap">
              {stars.map((star, index) => (
                <Star
                  key={index}
                  size={12}
                  className={`sm:w-3.5 sm:h-3.5 flex-shrink-0 ${
                    star === 1
                      ? "fill-yellow-400 text-yellow-400"
                      : star === 0.5
                      ? "fill-yellow-400/50 text-yellow-400"
                      : "text-gray-300 dark:text-gray-500"
                  }`}
                />
              ))}
              <span className="ml-1 text-xs text-gray-600 dark:text-gray-200">
                {casino.rating_avg.toFixed(1)} ({casino.rating_count})
              </span>
            </div>
          </div>
          
          {/* Promo Code */}
          {isPromoValid && (
            <div className="mb-2 flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <Ticket size={12} className="sm:w-3.5 sm:h-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <span className="text-xs font-semibold text-green-700 dark:text-green-300">
                Promo: <code className="bg-green-100 dark:bg-green-900 px-1 py-0.5 rounded break-all">{casino.promo_code}</code>
              </span>
            </div>
          )}
          
          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-200 mb-2 line-clamp-2">
            <span className="font-semibold">Bonus:</span> {casino.bonus}
          </p>
          
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
              {casino.license}
            </span>
            {casino.country && (
              <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded">
                {casino.country}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-600">
        <span className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
          {isExternal ? 'Visit Site' : 'Read Reviews'} →
        </span>
      </div>
    </div>
  );

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-white dark:bg-gray-700 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-200 dark:border-gray-600"
      >
        {CardContent}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className="block bg-white dark:bg-gray-700 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-200 dark:border-gray-600"
    >
      {CardContent}
    </Link>
  );
}
