export type EntryType = 'casino' | 'sister-site' | 'blog' | 'proxy';

export interface Casino {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
  bonus: string;
  license: string;
  description: string | null;
  rating_avg: number;
  rating_count: number;
  country?: string;
  payment_methods?: string[];
  entry_type?: EntryType;
  promo_code?: string | null;
  promo_code_expires_at?: string | null;
  editorial_rating?: number | null;
  external_url?: string | null;
  verified?: boolean;
  sister_site_of?: string | null;
  is_featured?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  casino_id: string;
  user_id: string;
  username: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  is_admin: boolean;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      casinos: {
        Row: Casino;
        Insert: Omit<Casino, 'id' | 'created_at' | 'updated_at' | 'rating_avg' | 'rating_count'> | { slug?: string };
        Update: Partial<Omit<Casino, 'id' | 'created_at'>>;
      };
      reviews: {
        Row: Review;
        Insert: Omit<Review, 'id' | 'created_at'>;
        Update: Partial<Omit<Review, 'id' | 'created_at'>>;
      };
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at'>;
        Update: Partial<User>;
      };
    };
  };
}
