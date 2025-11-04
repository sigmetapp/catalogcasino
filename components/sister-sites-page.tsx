"use client";

import { useState, useEffect, useCallback } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import { CasinoCard } from "./casino-card";
import type { Casino } from "@/lib/database.types";
import { Search, Filter, Link2 } from "lucide-react";

export function SisterSitesPage() {
  const [casinos, setCasinos] = useState<Casino[]>([]);
  const [filteredCasinos, setFilteredCasinos] = useState<Casino[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [licenseFilter, setLicenseFilter] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [promoCodeFilter, setPromoCodeFilter] = useState<boolean>(false);
  const [verifiedFilter, setVerifiedFilter] = useState<boolean>(false);

  useEffect(() => {
    loadCasinos();
  }, []);

  const filterCasinos = useCallback(() => {
    let filtered = casinos.filter((casino) => casino.entry_type === 'sister-site');

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (casino) =>
          casino.name.toLowerCase().includes(query) ||
          casino.bonus.toLowerCase().includes(query) ||
          casino.description?.toLowerCase().includes(query) ||
          casino.promo_code?.toLowerCase().includes(query)
      );
    }

    // License filter
    if (licenseFilter !== "all") {
      filtered = filtered.filter((casino) => casino.license === licenseFilter);
    }

    // Country filter
    if (countryFilter !== "all") {
      filtered = filtered.filter((casino) => casino.country === countryFilter);
    }

    // Rating filter
    if (ratingFilter !== "all") {
      const minRating = parseFloat(ratingFilter);
      filtered = filtered.filter((casino) => {
        const rating = casino.editorial_rating ?? casino.rating_avg;
        return rating >= minRating;
      });
    }

    // Promo code filter
    if (promoCodeFilter) {
      filtered = filtered.filter((casino) => {
        if (!casino.promo_code) return false;
        return !casino.promo_code_expires_at || new Date(casino.promo_code_expires_at) > new Date();
      });
    }

    // Verified filter
    if (verifiedFilter) {
      filtered = filtered.filter((casino) => casino.verified === true);
    }

    setFilteredCasinos(filtered);
  }, [casinos, searchQuery, licenseFilter, countryFilter, ratingFilter, promoCodeFilter, verifiedFilter]);

  useEffect(() => {
    filterCasinos();
  }, [filterCasinos]);

  async function loadCasinos() {
    try {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from("casinos")
        .select("*")
        .eq("entry_type", "sister-site")
        .order("is_featured", { ascending: false })
        .order("editorial_rating", { ascending: false, nullsFirst: false })
        .order("rating_avg", { ascending: false });

      if (error) throw error;
      
      setCasinos(data || []);
    } catch (error) {
      console.error("Error loading sister sites:", error);
      setCasinos([]);
    } finally {
      setLoading(false);
    }
  }

  const licenses = Array.from(new Set(casinos.map((c) => c.license))).sort();
  const countries = Array.from(
    new Set(casinos.map((c) => c.country).filter(Boolean))
  ).sort();
  
  const featuredEntries = filteredCasinos.filter((c) => c.is_featured);
  const regularEntries = filteredCasinos.filter((c) => !c.is_featured);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-200">Loading sister sites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="text-center px-2">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
          <Link2 className="text-purple-500 flex-shrink-0" size={28} style={{ width: '28px', height: '28px' }} />
          <span className="break-words">Sister Sites Catalog</span>
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-white max-w-3xl mx-auto px-2">
          Discover sister sites that share licenses and gaming experiences with trusted casino operators. 
          These sites offer exclusive bonuses and promotions for new players.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-4 sm:p-6 border border-gray-200 dark:border-gray-800">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search sister sites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                License
              </label>
              <select
                value={licenseFilter}
                onChange={(e) => setLicenseFilter(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Licenses</option>
                {licenses.map((license) => (
                  <option key={license} value={license}>
                    {license}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Country
              </label>
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Countries</option>
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Minimum Rating
              </label>
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Ratings</option>
                <option value="4">4+ Stars</option>
                <option value="3">3+ Stars</option>
                <option value="2">2+ Stars</option>
                <option value="1">1+ Star</option>
              </select>
            </div>

            <div className="flex items-end">
              <div className="w-full space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={promoCodeFilter}
                    onChange={(e) => setPromoCodeFilter(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 flex-shrink-0"
                  />
                  <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200">
                    Has Promo Code
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verifiedFilter}
                    onChange={(e) => setVerifiedFilter(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 flex-shrink-0"
                  />
                  <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200">
                    Verified Only
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <p className="text-sm sm:text-base text-gray-600 dark:text-white mb-4 px-2">
          Showing {filteredCasinos.length} sister site{filteredCasinos.length !== 1 ? "s" : ""}
        </p>

        {filteredCasinos.length === 0 ? (
          <div className="text-center py-8 sm:py-12 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 px-4">
            <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-200">
              No sister sites found matching your criteria.
            </p>
          </div>
        ) : (
          <>
            {featuredEntries.length > 0 && (
              <div className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2 px-2">
                  <span className="text-purple-500">⭐</span>
                  Featured Sister Sites
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
                    All Sister Sites
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
