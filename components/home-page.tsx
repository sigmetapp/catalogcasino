"use client";

import { useState, useEffect, useCallback } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import { CasinoCard } from "./casino-card";
import type { Casino, EntryType } from "@/lib/database.types";
import { Search, Filter, Sparkles, Ticket, CheckCircle } from "lucide-react";

// Demo data fallback
const demoCasinos: Casino[] = [
  {
    id: "demo-1",
    name: "Royal Vegas Casino",
    slug: "royal-vegas-casino",
    logo_url: "https://via.placeholder.com/150?text=Royal+Vegas",
    bonus: "Welcome Bonus: $500 + 100 Free Spins",
    license: "Malta Gaming Authority",
    description: "Royal Vegas Casino offers a premium gaming experience with over 500 slot games, live dealer tables, and a comprehensive loyalty program. Established in 2000, it has become one of the most trusted online casinos in the industry.",
    country: "Malta",
    payment_methods: ["Visa", "Mastercard", "PayPal", "Skrill", "Neteller", "Bitcoin"],
    rating_avg: 4.5,
    rating_count: 234,
    entry_type: "casino",
    promo_code: "ROYAL500",
    promo_code_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    editorial_rating: 4.7,
    verified: true,
    is_featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-2",
    name: "Betway Casino",
    slug: "betway-casino",
    logo_url: "https://via.placeholder.com/150?text=Betway",
    bonus: "100% Match Bonus up to $1,000",
    license: "UK Gambling Commission",
    description: "Betway Casino is a leading online casino platform known for its extensive game library, fast payouts, and excellent customer support. The casino features games from top providers and offers a mobile-optimized experience.",
    country: "United Kingdom",
    payment_methods: ["Visa", "Mastercard", "PayPal", "Bank Transfer", "Ethereum"],
    rating_avg: 4.7,
    rating_count: 189,
    entry_type: "casino",
    editorial_rating: 4.8,
    verified: true,
    is_featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-3",
    name: "LeoVegas Casino",
    slug: "leovegas-casino",
    logo_url: "https://via.placeholder.com/150?text=LeoVegas",
    bonus: "Up to $1,200 + 120 Free Spins",
    license: "Malta Gaming Authority",
    description: "LeoVegas is the \"King of Mobile Casino\" with an award-winning mobile platform. It offers a wide selection of slots, table games, and live casino options. The casino is known for its quick withdrawals and 24/7 customer service.",
    country: "Sweden",
    payment_methods: ["Visa", "Mastercard", "PayPal", "Trustly", "Zimpler"],
    rating_avg: 4.6,
    rating_count: 312,
    entry_type: "casino",
    promo_code: "LEO1200",
    promo_code_expires_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
    editorial_rating: 4.6,
    verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-4",
    name: "Casino Player Blog",
    slug: "casino-player-blog",
    logo_url: "https://via.placeholder.com/150?text=Blog",
    bonus: "Real player experiences and bonus guides",
    license: "N/A",
    description: "A blog where players share their real experiences with online casinos, including detailed reviews, bonus guides, and tips for getting the most out of casino offers.",
    country: undefined,
    payment_methods: undefined,
    rating_avg: 4.3,
    rating_count: 45,
    entry_type: "blog",
    external_url: "https://example.com/casino-blog",
    verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-5",
    name: "888 Casino Sister Site",
    slug: "888-casino-sister",
    logo_url: "https://via.placeholder.com/150?text=888+Sister",
    bonus: "Exclusive Welcome Bonus: $400 + 88 Free Spins",
    license: "UK Gambling Commission",
    description: "Sister site of 888 Casino offering exclusive bonuses and promotions. Same trusted license and gaming experience with special offers for new players.",
    country: "United Kingdom",
    payment_methods: ["Visa", "Mastercard", "PayPal", "Skrill", "Neteller", "Apple Pay"],
    rating_avg: 4.4,
    rating_count: 156,
    entry_type: "sister-site",
    promo_code: "SISTER888",
    promo_code_expires_at: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days from now
    editorial_rating: 4.5,
    verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-6",
    name: "Casino Proxy Portal",
    slug: "casino-proxy-portal",
    logo_url: "https://via.placeholder.com/150?text=Proxy",
    bonus: "Access to restricted casino sites",
    license: "N/A",
    description: "A proxy service that helps players access casino sites that may be restricted in their region. Provides secure connections and maintains player privacy.",
    country: undefined,
    payment_methods: undefined,
    rating_avg: 4.2,
    rating_count: 78,
    entry_type: "proxy",
    external_url: "https://example.com/proxy-service",
    verified: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export function HomePage() {
  const [casinos, setCasinos] = useState<Casino[]>([]);
  const [filteredCasinos, setFilteredCasinos] = useState<Casino[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [entryTypeFilter, setEntryTypeFilter] = useState<string>("all");
  const [licenseFilter, setLicenseFilter] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [promoCodeFilter, setPromoCodeFilter] = useState<boolean>(false);
  const [verifiedFilter, setVerifiedFilter] = useState<boolean>(false);
  const [showFeaturedOnly, setShowFeaturedOnly] = useState<boolean>(false);

  useEffect(() => {
    loadCasinos();
  }, []);

  const filterCasinos = useCallback(() => {
    let filtered = [...casinos];

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

    // Entry type filter
    if (entryTypeFilter !== "all") {
      filtered = filtered.filter((casino) => casino.entry_type === entryTypeFilter);
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
        // Check if promo code is not expired
        return !casino.promo_code_expires_at || new Date(casino.promo_code_expires_at) > new Date();
      });
    }

    // Verified filter
    if (verifiedFilter) {
      filtered = filtered.filter((casino) => casino.verified === true);
    }

    // Featured filter
    if (showFeaturedOnly) {
      filtered = filtered.filter((casino) => casino.is_featured === true);
    }

    setFilteredCasinos(filtered);
  }, [casinos, searchQuery, entryTypeFilter, licenseFilter, countryFilter, ratingFilter, promoCodeFilter, verifiedFilter, showFeaturedOnly]);

  useEffect(() => {
    filterCasinos();
  }, [filterCasinos]);

  async function loadCasinos() {
    try {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from("casinos")
        .select("*")
        .order("is_featured", { ascending: false })
        .order("editorial_rating", { ascending: false, nullsFirst: false })
        .order("rating_avg", { ascending: false });

      if (error) throw error;
      
      // Use loaded data if available, otherwise use demo data
      if (data && data.length > 0) {
        setCasinos(data);
      } else {
        // No data in database, use demo data
        setCasinos(demoCasinos);
      }
    } catch (error) {
      console.error("Error loading casinos:", error);
      // On error, use demo data as fallback
      setCasinos(demoCasinos);
    } finally {
      setLoading(false);
    }
  }

  const entryTypes = Array.from(
    new Set(casinos.map((c) => c.entry_type || 'casino'))
  ).sort() as EntryType[];
  const licenses = Array.from(new Set(casinos.map((c) => c.license))).sort();
  const countries = Array.from(
    new Set(casinos.map((c) => c.country).filter(Boolean))
  ).sort();
  
  // Separate featured and regular entries
  const featuredEntries = filteredCasinos.filter((c) => c.is_featured);
  const regularEntries = filteredCasinos.filter((c) => !c.is_featured);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-200">Loading casinos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="text-center px-2">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
          <Sparkles className="text-yellow-500 flex-shrink-0" size={28} style={{ width: '28px', height: '28px' }} />
          <span className="break-words">Casino Experience Hub</span>
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-200 max-w-3xl mx-auto px-2">
          Your comprehensive guide to online casinos, sister sites, player blogs, and exclusive promo codes. 
          Discover verified casinos that actually pay, read real player experiences, and find unique offers.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-4 sm:p-6 border border-gray-200 dark:border-gray-800">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search casinos, blogs, promo codes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Entry Type
              </label>
              <select
                value={entryTypeFilter}
                onChange={(e) => setEntryTypeFilter(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="casino">🎰 Casinos</option>
                <option value="sister-site">🔗 Sister Sites</option>
                <option value="blog">💬 Blogs</option>
                <option value="proxy">🌐 Proxy Sites</option>
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                License
              </label>
              <select
                value={licenseFilter}
                onChange={(e) => setLicenseFilter(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Ratings</option>
                <option value="4">4+ Stars</option>
                <option value="3">3+ Stars</option>
                <option value="2">2+ Stars</option>
                <option value="1">1+ Star</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={promoCodeFilter}
                onChange={(e) => setPromoCodeFilter(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 flex-shrink-0"
              />
              <Ticket size={16} className="sm:w-[18px] sm:h-[18px] text-green-600 dark:text-green-400 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200">
                Has Promo Code
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={verifiedFilter}
                onChange={(e) => setVerifiedFilter(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 flex-shrink-0"
              />
              <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px] text-green-600 dark:text-green-400 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200">
                Verified Only
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showFeaturedOnly}
                onChange={(e) => setShowFeaturedOnly(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 flex-shrink-0"
              />
              <Sparkles size={16} className="sm:w-[18px] sm:h-[18px] text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200">
                Featured Only
              </span>
            </label>
          </div>
        </div>
      </div>

      <div>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-200 mb-4 px-2">
          Showing {filteredCasinos.length} entr{filteredCasinos.length !== 1 ? "ies" : "y"}
        </p>

        {filteredCasinos.length === 0 ? (
          <div className="text-center py-8 sm:py-12 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 px-4">
            <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-200">
              No entries found matching your criteria.
            </p>
          </div>
        ) : (
          <>
            {featuredEntries.length > 0 && (
              <div className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2 px-2">
                  <Sparkles className="text-yellow-500 flex-shrink-0" size={20} style={{ width: '20px', height: '20px' }} />
                  Featured
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
                    All Entries
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
