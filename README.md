# Casino Directory

A full-stack web application for discovering and reviewing online casinos. Built with Next.js 14, TypeScript, Supabase, and Tailwind CSS.

## Features

- 🎰 **Casino Listings**: Browse casinos with ratings, bonuses, and license information
- ⭐ **Rating System**: Users can rate casinos from 1-5 stars
- 💬 **Reviews**: Authenticated users can leave reviews and comments
- 🔍 **Search & Filter**: Find casinos by name, license, country, or rating
- 👤 **Authentication**: Google Sign-In via Supabase Auth
- 🛡️ **Admin Panel**: Manage casinos and moderate reviews (admin only)
- 🌓 **Dark Mode**: Toggle between light and dark themes
- 📱 **Responsive**: Mobile-friendly design

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database & Auth**: Supabase
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Prerequisites

- Node.js 18+ and npm/yarn
- A Supabase account and project

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd casino-directory
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API to get your credentials
3. Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

4. Fill in your Supabase credentials in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 4. Set up the database

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL script from `supabase-schema.sql` to create all tables, policies, and triggers
4. **Add demo data**: You have two options:
   - **Option A (Recommended for production)**: Run the SQL script from `seed-demo-casinos.sql` in Supabase SQL Editor
   - **Option B (For development)**: Use the API endpoint:
     ```bash
     # Check if seeding is needed
     curl https://your-domain.com/api/seed
     
     # Seed the database (requires SEED_SECRET_TOKEN if set)
     curl -X POST https://your-domain.com/api/seed \
       -H "Authorization: Bearer YOUR_SECRET_TOKEN"
     ```
     Or use the npm script:
     ```bash
     npm run seed:casinos
     ```

### 5. Configure Google OAuth

1. In Supabase dashboard, go to Authentication > Providers
2. Enable Google provider
3. Add your Google OAuth credentials:
   - Client ID
   - Client Secret
4. Add authorized redirect URL: `https://your-project-url.supabase.co/auth/v1/callback`

### 6. Create an admin user

After creating your first user account, you can make them an admin by running this SQL in Supabase SQL Editor:

```sql
UPDATE users
SET is_admin = TRUE
WHERE email = 'your-email@example.com';
```

### 7. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/
│   ├── admin/          # Admin panel page
│   ├── auth/           # Authentication page
│   ├── casino/[id]/    # Casino detail page
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Home page
│   └── globals.css     # Global styles
├── components/
│   ├── admin-panel.tsx # Admin panel component
│   ├── auth-page.tsx   # Auth page component
│   ├── casino-card.tsx # Casino card component
│   ├── casino-detail-page.tsx # Casino detail component
│   ├── home-page.tsx   # Home page component
│   ├── review-card.tsx # Review card component
│   ├── review-form.tsx # Review form component
│   ├── rating-stars.tsx # Rating stars component
│   ├── header.tsx      # Header component
│   ├── auth-provider.tsx # Auth context provider
│   └── theme-provider.tsx # Theme context provider
├── lib/
│   ├── supabase.ts     # Supabase client utilities
│   ├── database.types.ts # Database type definitions
│   ├── auth.ts         # Auth utility functions
│   └── utils.ts        # General utilities
└── public/             # Static assets
```

## Database Schema

### Casinos
- `id` (UUID)
- `name` (TEXT)
- `logo_url` (TEXT)
- `bonus` (TEXT)
- `license` (TEXT)
- `description` (TEXT, nullable)
- `country` (TEXT, nullable)
- `payment_methods` (TEXT[], nullable)
- `rating_avg` (NUMERIC, 0-5)
- `rating_count` (INTEGER)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Reviews
- `id` (UUID)
- `casino_id` (UUID, FK)
- `user_id` (UUID, FK)
- `username` (TEXT)
- `rating` (INTEGER, 1-5)
- `comment` (TEXT)
- `created_at` (TIMESTAMP)

### Users
- `id` (UUID, FK to auth.users)
- `email` (TEXT)
- `name` (TEXT, nullable)
- `is_admin` (BOOLEAN)
- `created_at` (TIMESTAMP)

## Features Explained

### Authentication
- Users can sign in with Google
- Only authenticated users can leave reviews
- Non-authenticated users can browse and read reviews

### Ratings & Reviews
- Each casino displays average rating from all user reviews
- Users can rate casinos from 1-5 stars
- Reviews include username, rating, comment, and date
- Rating average updates automatically when reviews are added/deleted

### Admin Panel
- Accessible only to users with `is_admin = TRUE`
- Admins can:
  - Add, edit, and delete casinos
  - View and delete user reviews
  - See statistics (average ratings, review counts)

### Search & Filter
- Search by casino name, bonus, or description
- Filter by license type
- Filter by country
- Filter by minimum rating

## Quick Start: Fill Database with Demo Data

If your database is empty and you need to add demo casinos, see [SEEDING.md](./SEEDING.md) for detailed instructions.

Quick options:
- **SQL Script**: Run `seed-demo-casinos.sql` in Supabase SQL Editor (recommended)
- **API Endpoint**: `POST /api/seed` (requires `SEED_SECRET_TOKEN` if set)
- **NPM Script**: `npm run seed:casinos` (for local development)

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SEED_SECRET_TOKEN` (optional, for securing the seed endpoint)
4. Deploy
5. **Initialize the database**:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Run the SQL script from `seed-demo-casinos.sql` (includes schema + demo data)
   - Or use the seed API endpoint after deployment:
     ```bash
     curl -X POST https://your-app.vercel.app/api/seed \
       -H "Authorization: Bearer YOUR_SEED_SECRET_TOKEN"
     ```

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- DigitalOcean App Platform

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
