"use client";

import { useState, useEffect, useCallback } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import { CasinoCard } from "./casino-card";
import type { Casino } from "@/lib/database.types";
import { Search, Filter } from "lucide-react";

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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-4",
    name: "888 Casino",
    slug: "888-casino",
    logo_url: "https://via.placeholder.com/150?text=888+Casino",
    bonus: "New Player Package: $400 + 88 Free Spins",
    license: "UK Gambling Commission",
    description: "888 Casino is one of the oldest and most respected online casinos, operating since 1997. It offers a diverse range of games including exclusive titles, live dealer games, and a comprehensive sportsbook. The platform is available in multiple languages.",
    country: "United Kingdom",
    payment_methods: ["Visa", "Mastercard", "PayPal", "Skrill", "Neteller", "Apple Pay"],
    rating_avg: 4.4,
    rating_count: 278,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-5",
    name: "Casumo Casino",
    slug: "casumo-casino",
    logo_url: "https://via.placeholder.com/150?text=Casumo",
    bonus: "Welcome Bonus: $1,200 + 200 Free Spins",
    license: "Malta Gaming Authority",
    description: "Casumo is an innovative casino platform that gamifies the online casino experience. Players earn rewards and level up while playing. The casino features a unique design, fast payments, and a vast selection of games from top providers.",
    country: "Malta",
    payment_methods: ["Visa", "Mastercard", "PayPal", "Skrill", "Trustly", "Bitcoin"],
    rating_avg: 4.8,
    rating_count: 156,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export function HomePage() {
  const [casinos, setCasinos] = useState<Casino[]>([]);
  const [filteredCasinos, setFilteredCasinos] = useState<Casino[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [licenseFilter, setLicenseFilter] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");

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
          casino.description?.toLowerCase().includes(query)
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
      filtered = filtered.filter((casino) => casino.rating_avg >= minRating);
    }

    setFilteredCasinos(filtered);
  }, [casinos, searchQuery, licenseFilter, countryFilter, ratingFilter]);

  useEffect(() => {
    filterCasinos();
  }, [filterCasinos]);

  async function loadCasinos() {
    try {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from("casinos")
        .select("*")
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

  const licenses = Array.from(new Set(casinos.map((c) => c.license))).sort();
  const countries = Array.from(
    new Set(casinos.map((c) => c.country).filter(Boolean))
  ).sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading casinos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          🎰 Casino Directory
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Discover and review the best online casinos
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search casinos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                License
              </label>
              <select
                value={licenseFilter}
                onChange={(e) => setLicenseFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Country
              </label>
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Minimum Rating
              </label>
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Ratings</option>
                <option value="4">4+ Stars</option>
                <option value="3">3+ Stars</option>
                <option value="2">2+ Stars</option>
                <option value="1">1+ Star</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Showing {filteredCasinos.length} casino{filteredCasinos.length !== 1 ? "s" : ""}
        </p>

        {filteredCasinos.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              No casinos found matching your criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCasinos.map((casino) => (
              <CasinoCard key={casino.id} casino={casino} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
