"use client";

import { useState, useEffect, useCallback } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import { CasinoCard } from "./casino-card";
import type { Casino } from "@/lib/database.types";
import { Search, FileText, CheckCircle, Ticket } from "lucide-react";

// Demo data for review sites
const demoReviewSites: Casino[] = [
  {
    id: "demo-review-1",
    name: "Casino Review Portal",
    slug: "casino-review-portal",
    logo_url: "https://via.placeholder.com/150?text=Review",
    bonus: "Personal reviews, pros & cons, alternatives, registration help",
    license: "N/A",
    description: "A comprehensive review site that provides personal casino reviews, lists pros and cons, suggests alternatives, helps with registration, provides promo codes, assists with withdrawals, and offers detailed reviews.",
    country: undefined,
    payment_methods: undefined,
    rating_avg: 4.2,
    rating_count: 78,
    entry_type: "review-site",
    external_url: "https://example.com/review-service",
    verified: false,
    is_featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-review-2",
    name: "Casino Analyst Pro",
    slug: "casino-analyst-pro",
    logo_url: "https://via.placeholder.com/150?text=Analyst",
    bonus: "Expert analysis, withdrawal guides, promo code database",
    license: "N/A",
    description: "Professional casino analysis site offering expert reviews, detailed pros and cons, withdrawal assistance guides, comprehensive promo code database, and alternative recommendations.",
    country: undefined,
    payment_methods: undefined,
    rating_avg: 4.5,
    rating_count: 124,
    entry_type: "review-site",
    external_url: "https://example.com/analyst-pro",
    verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-review-3",
    name: "Casino Guide Hub",
    slug: "casino-guide-hub",
    logo_url: "https://via.placeholder.com/150?text=Guide",
    bonus: "Registration help, withdrawal support, detailed reviews",
    license: "N/A",
    description: "Your complete guide to online casinos. Provides step-by-step registration help, withdrawal assistance, detailed reviews with pros and cons, and exclusive promo codes.",
    country: undefined,
    payment_methods: undefined,
    rating_avg: 4.3,
    rating_count: 98,
    entry_type: "review-site",
    external_url: "https://example.com/guide-hub",
    verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-review-4",
    name: "Casino Insights Pro",
    slug: "casino-insights-pro",
    logo_url: "https://via.placeholder.com/150?text=Insights",
    bonus: "In-depth reviews, comparison tools, promo code finder",
    license: "N/A",
    description: "Professional casino insights platform offering in-depth reviews, comparison tools, comprehensive promo code finder, withdrawal guides, and personalized recommendations.",
    country: undefined,
    payment_methods: undefined,
    rating_avg: 4.4,
    rating_count: 112,
    entry_type: "review-site",
    external_url: "https://example.com/insights-pro",
    verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-review-5",
    name: "Casino Review Expert",
    slug: "casino-review-expert",
    logo_url: "https://via.placeholder.com/150?text=Expert",
    bonus: "Expert reviews, alternatives, registration assistance",
    license: "N/A",
    description: "Expert casino review site providing detailed analysis, pros and cons, alternative casino recommendations, step-by-step registration help, and withdrawal support guides.",
    country: undefined,
    payment_methods: undefined,
    rating_avg: 4.3,
    rating_count: 89,
    entry_type: "review-site",
    external_url: "https://example.com/review-expert",
    verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-review-6",
    name: "Casino Comparison Hub",
    slug: "casino-comparison-hub",
    logo_url: "https://via.placeholder.com/150?text=Compare",
    bonus: "Side-by-side comparisons, promo codes, withdrawal help",
    license: "N/A",
    description: "Compare casinos side-by-side with detailed reviews, pros and cons, alternative options, exclusive promo codes, and comprehensive withdrawal assistance guides.",
    country: undefined,
    payment_methods: undefined,
    rating_avg: 4.2,
    rating_count: 95,
    entry_type: "review-site",
    external_url: "https://example.com/comparison-hub",
    verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export function ReviewSitesPage() {
  const [casinos, setCasinos] = useState<Casino[]>([]);
  const [filteredCasinos, setFilteredCasinos] = useState<Casino[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [verifiedFilter, setVerifiedFilter] = useState<boolean>(false);

  useEffect(() => {
    loadCasinos();
  }, []);

  const filterCasinos = useCallback(() => {
    let filtered = casinos.filter((casino) => casino.entry_type === 'review-site');

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (casino) =>
          casino.name.toLowerCase().includes(query) ||
          casino.bonus.toLowerCase().includes(query) ||
          casino.description?.toLowerCase().includes(query)
      );
    }

    // Rating filter
    if (ratingFilter !== "all") {
      const minRating = parseFloat(ratingFilter);
      filtered = filtered.filter((casino) => {
        const rating = casino.editorial_rating ?? casino.rating_avg;
        return rating >= minRating;
      });
    }

    // Verified filter
    if (verifiedFilter) {
      filtered = filtered.filter((casino) => casino.verified === true);
    }

    setFilteredCasinos(filtered);
  }, [casinos, searchQuery, ratingFilter, verifiedFilter]);

  useEffect(() => {
    filterCasinos();
  }, [filterCasinos]);

  async function loadCasinos() {
    try {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from("casinos")
        .select("*")
        .eq("entry_type", "review-site")
        .order("is_featured", { ascending: false })
        .order("editorial_rating", { ascending: false, nullsFirst: false })
        .order("rating_avg", { ascending: false });

      if (error) throw error;
      
      // Use loaded data if available, otherwise use demo data
      if (data && data.length > 0) {
        setCasinos(data);
      } else {
        // No data in database, use demo data
        setCasinos(demoReviewSites);
      }
    } catch (error) {
      console.error("Error loading review sites:", error);
      // On error, use demo data as fallback
      setCasinos(demoReviewSites);
    } finally {
      setLoading(false);
    }
  }
  
  const featuredEntries = filteredCasinos.filter((c) => c.is_featured);
  const regularEntries = filteredCasinos.filter((c) => !c.is_featured);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-200">Loading review sites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="text-center px-2">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
          <FileText className="text-orange-500 flex-shrink-0" size={28} style={{ width: '28px', height: '28px' }} />
          <span className="break-words">Review Sites Catalog</span>
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-white max-w-3xl mx-auto px-2">
          Explore review sites that provide comprehensive casino analysis, personal reviews, pros and cons, 
          alternative recommendations, registration assistance, promo codes, withdrawal help, and detailed reviews.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-4 sm:p-6 border border-gray-200 dark:border-gray-800">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search review sites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Minimum Rating
              </label>
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">All Ratings</option>
                <option value="4">4+ Stars</option>
                <option value="3">3+ Stars</option>
                <option value="2">2+ Stars</option>
                <option value="1">1+ Star</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={verifiedFilter}
                  onChange={(e) => setVerifiedFilter(e.target.checked)}
                  className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500 flex-shrink-0"
                />
                <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px] text-green-600 dark:text-green-400 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200">
                  Verified Only
                </span>
              </label>
            </div>

            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
              <Ticket size={16} className="text-orange-500 flex-shrink-0" />
              <span>These sites provide promo codes, registration help, and withdrawal assistance</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <p className="text-sm sm:text-base text-gray-600 dark:text-white mb-4 px-2">
          Showing {filteredCasinos.length} review site{filteredCasinos.length !== 1 ? "s" : ""}
        </p>

        {filteredCasinos.length === 0 ? (
          <div className="text-center py-8 sm:py-12 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 px-4">
            <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-200">
              No review sites found matching your criteria.
            </p>
          </div>
        ) : (
          <>
            {featuredEntries.length > 0 && (
              <div className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2 px-2">
                  <span className="text-orange-500">⭐</span>
                  Featured Review Sites
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {featuredEntries.map((casino) => (
                    <CasinoCard key={casino.id} casino={casino} />
                  ))}
                </div>
              </div>
            )}

            {regularEntries.length > 0 && (
              <div>
                {featuredEntries.length > 0 && (
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 px-2">
                    All Review Sites
                  </h2>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {regularEntries.map((casino) => (
                    <CasinoCard key={casino.id} casino={casino} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
