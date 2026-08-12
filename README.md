# 🎓 SkillSwap — Peer-to-Peer Student Skill Exchange Platform

![SkillSwap Platform](https://img.shields.io/badge/Framework-Next.js%2014-black?style=for-the-badge&logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth%20%26%20Realtime-3ECF8E?style=for-the-badge&logo=supabase)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

SkillSwap is a production-ready, peer-to-peer student skill exchange platform built with **Next.js 14 App Router**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, and **Supabase**. It connects university students who want to barter skills—such as teaching React in exchange for learning Python or Machine Learning—democratizing education through peer mentorship.

---

## ✨ Features

### 🔐 1. Authentication & Onboarding
- **Supabase SSR Auth**: Email & password authentication with secure session tokens via Next.js middleware.
- **5-Step Onboarding Wizard**: Step-by-step profile setup (Basic Info -> University & Major -> Teaching Skills -> Learning Goals -> Profile Visibility).
- **Profile Management**: Avatar upload using Supabase Storage buckets, bio editing, experience level selection, and schedule availability.

### 🎯 2. Smart 2-Way Skill Matching Engine
- **Deterministic 2-Way Matching**: Calculates real-time 0–100% compatibility scores between students based on:
  - Target student teaches what you want to learn (+40%)
  - You teach what target student wants to learn (+40%)
  - Experience level alignment (+10%)
  - Weekly schedule availability alignment (+10%)
- **Human-Readable Match Reasons**: Explains why two students match with clear bulleted reasons (e.g. `✓ Sarah can teach React.js`, `✓ You can teach Python to Sarah`).

### 🔍 3. Discover Marketplace & Faceted Search
- **Faceted Filters**: Filter by skill category, specific skill, experience level, university, availability, and minimum match score threshold.
- **Debounced Search**: Text search across full names, usernames, universities, and skill tags with URL parameter state sync (`/discover?q=react&category=Software+%26+Web+Development`).
- **Dynamic Data Access**: 100% database-driven queries backed by PostgreSQL B-tree indexes with zero static/mock fallbacks.

### 📩 4. Exchange Requests System
- **Request Skill Exchange Modal**: Interactive dialog allowing students to select a skill to learn, a skill to offer in return, and write an optional note.
- **Requests Dashboard (`/requests`)**: Categorized tabs for Incoming, Sent, Accepted, Rejected, and Cancelled requests.
- **Server-Side Validation**: Enforces duplicate request protection and skill ownership checks.

### 💬 5. Active Exchanges & Free Supabase Realtime Chat
- **Atomic Acceptance**: Accepting a request atomically creates an active exchange record and initializes a private 1-to-1 conversation.
- **Supabase Realtime WebSockets**: `/messages` features responsive split-view messaging with live WebSocket message streaming (`supabase.channel(...)`), automatic unread counters, and channel cleanup on unmount. 100% free-tier compatible with zero paid chat dependencies.

### 🔔 6. Notifications & Peer Star Ratings
- **In-App Realtime Notifications**: Real-time notification queue for new exchange requests, acceptances, messages, exchange completions, and review alerts.
- **5-Star Peer Ratings**: Enables 1–5 filled star ratings + written reviews for completed exchanges.
- **Reputation Metrics**: Dynamically updates student star ratings and exchange counts across public profile pages (`/students/[id]`).

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14 App Router](https://nextjs.org/)
- **Language**: [TypeScript 5.6](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 3.4](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Database & Auth**: [Supabase PostgreSQL](https://supabase.com/) with Row Level Security (RLS) & Supabase Auth SSR
- **Realtime Infrastructure**: Supabase Realtime WebSockets
- **ORM / Schema**: Prisma ORM & Supabase SQL Migrations

---

## 📁 Project Architecture

```text
skillswap/
├── app/
│   ├── (auth)/             # Auth routes (/login, /signup, /forgot-password, /reset-password)
│   ├── (onboarding)/       # 5-step onboarding wizard (/onboarding)
│   ├── (dashboard)/        # Authenticated application shell & views
│   │   ├── dashboard/      # Dynamic main dashboard
│   │   ├── discover/       # Peer discovery marketplace & search
│   │   ├── requests/       # Incoming & sent exchange requests
│   │   ├── exchanges/      # Active & completed exchanges (/exchanges/[id])
│   │   ├── messages/       # Free Supabase Realtime WebSocket chat
│   │   ├── notifications/  # Notification center & real-time alerts
│   │   ├── profile/        # Self profile & edit views (/profile/edit)
│   │   └── students/[id]/  # Public student profile view
│   └── globals.css         # HSL visual design system matching DESIGN.md
├── components/
│   ├── auth/               # Authentication layouts
│   ├── discover/           # StudentCard, FilterSidebar, ActiveFilters, MatchReasons
│   ├── layout/             # AppShell navigation & header counters
│   ├── profile/            # AvatarUpload & profile widgets
│   ├── ratings/            # RatingModal star review dialog
│   ├── requests/           # RequestExchangeModal dialog
│   ├── skills/             # SkillBadge & SkillSelector
│   └── ui/                 # shadcn UI primitives (Button, Card, Dialog, Input, Select, etc.)
├── lib/
│   ├── chat/               # Real-time chat queries & WebSocket subscriptions
│   ├── discover/           # Database discover queries & filters
│   ├── exchanges/          # Active exchange queries & completion actions
│   ├── matching/           # 2-way deterministic matching algorithm
│   ├── notifications/      # Notification queries & real-time subscriptions
│   ├── profiles/           # User profile & completion calculation
│   ├── ratings/            # Star ratings & review summaries
│   ├── requests/           # Request creation & atomic acceptance
│   ├── skills/             # Database skills & dynamic category queries
│   └── supabase/           # Client, Server, and Middleware Supabase SSR handlers
├── prisma/
│   └── schema.prisma       # Prisma database schema definition
├── supabase/
│   └── migrations/         # PostgreSQL schema & RLS migration scripts
└── DESIGN.md               # Visual design tokens & design guidelines
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **Supabase Account**: Free project at [supabase.com](https://supabase.com)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/MeNabeel/SkillSwap.git
cd skillswap
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase API Credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Postgres Connection Pooler Strings (Optional for Prisma)
DATABASE_URL="postgresql://postgres.your-project:[PASSWORD]@aws-0-pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.your-project:[PASSWORD]@aws-0-pooler.supabase.com:5432/postgres"
```

### 3. Setup Database Schema (Supabase SQL Editor)

Copy and run the combined SQL migration scripts from [`supabase/migrations/`](file:///c:/Users/Nabeel/Desktop/skillswap/supabase/migrations/) in your **Supabase Dashboard -> SQL Editor**:

- `20260812000000_initial_schema.sql` (Profiles, Skills, User Skills, RLS, Storage Bucket)
- `20260812000001_phase2_indexes.sql` (B-tree Search Indexes)
- `20260812000002_phase345_schema.sql` (Requests, Exchanges, Conversations, Messages, Notifications, Ratings, Realtime)

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Production Verification

Run the type check and production build verification commands:

```bash
# TypeScript compilation check
npx tsc --noEmit

# Production Next.js build
npm run build
```

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
