"use client";

import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import type { Casino } from "@/lib/database.types";
import { getRatingStars } from "@/lib/utils";

interface CasinoCardProps {
  casino: Casino;
}

export function CasinoCard({ casino }: CasinoCardProps) {
  const stars = getRatingStars(casino.rating_avg);

  return (
    <Link
      href={`/casino/${casino.id}`}
      className="block bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-200 dark:border-gray-700"
    >
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <Image
              src={casino.logo_url || "/placeholder-logo.svg"}
              alt={casino.name}
              width={80}
              height={80}
              className="rounded-lg object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder-logo.svg";
              }}
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 truncate">
              {casino.name}
            </h3>
            
            <div className="flex items-center gap-1 mb-2">
              {stars.map((star, index) => (
                <Star
                  key={index}
                  size={16}
                  className={
                    star === 1
                      ? "fill-yellow-400 text-yellow-400"
                      : star === 0.5
                      ? "fill-yellow-400/50 text-yellow-400"
                      : "text-gray-300 dark:text-gray-600"
                  }
                />
              ))}
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                {casino.rating_avg.toFixed(1)} ({casino.rating_count} reviews)
              </span>
            </div>
            
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              <span className="font-semibold">Bonus:</span> {casino.bonus}
            </p>
            
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                {casino.license}
              </span>
              {casino.country && (
                <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                  {casino.country}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <span className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
            Read Reviews →
          </span>
        </div>
      </div>
    </Link>
  );
}
