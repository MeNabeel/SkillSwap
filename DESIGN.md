# SkillSwap — Design System & UI Specification

Welcome to the design system for **SkillSwap**, a peer-to-peer student skill exchange platform. This document defines the brand identity, layout rules, token architecture, and UI behavior.

---

## 1. Brand Identity & Vision

* **Brand Name**: SkillSwap
* **Tagline**: Learn together. Teach together. Connect through skills.
* **Core Philosophy**: Empowering students to exchange knowledge democratically without financial barriers.
* **Visual Tone**: Professional Education + Community + Skill Network. Warm, clean, modern, trustworthy, and accessible. No heavy purple/blue AI SaaS templates or glowing neon gradients.

---

## 2. Color System

SkillSwap utilizes a professional HSL-based palette centered around Deep Emerald/Teal and Warm Amber:

### Primary Colors
* **Deep Emerald (Primary)**: `#0F766E` (`hsl(175, 77%, 26%)`) — Main brand accents, primary buttons, active tabs, active navigation states.
* **Emerald Hover**: `#115E59` (`hsl(175, 68%, 22%)`)
* **Subtle Emerald Tint**: `hsl(160, 30%, 95%)` / Dark: `hsl(175, 40%, 15%)`

### Accent Colors
* **Warm Amber (Accent & Ratings)**: `#D97706` (`hsl(38, 92%, 50%)`) — Used for ratings, high match percentage badges, pending alerts, key CTAs.
* **Natural Green (Success)**: `hsl(142, 71%, 45%)` — Positive confirmations, online status.
* **Rose (Destructive & Error)**: `hsl(346, 84%, 61%)` — Rejected/cancelled requests, delete actions, errors.

### Neutral Colors
* **Background**: `#F8FAF9` (`hsl(150, 15%, 97%)`) (Light) / `hsl(217, 33%, 11%)` (Dark)
* **Card Surface**: `#FFFFFF` (`hsl(0, 0%, 100%)`) (Light) / `hsl(217, 33%, 16%)` (Dark)
* **Border**: `#E2E8F0` (`hsl(214, 32%, 91%)`) (Light) / `hsl(217, 19%, 24%)` (Dark)
* **Text Primary**: `#1F2937` (`hsl(217, 33%, 17%)`) (Light) / `hsl(150, 15%, 97%)` (Dark)
* **Text Muted**: `#64748B` (`hsl(215, 16%, 47%)`) (Light) / `hsl(215, 20%, 65%)` (Dark)

---

## 3. Typography

* **Font Family**: Inter, system-ui, -apple-system, sans-serif.
* **Heading Scale**:
  * `H1` (Page Title): `2.25rem` (36px), font-weight `700`, tracking `-0.025em`.
  * `H2` (Section Header): `1.75rem` (28px), font-weight `600`, tracking `-0.02em`.
  * `H3` (Card Header): `1.25rem` (20px), font-weight `600`.
  * `H4` (Group Label): `1rem` (16px), font-weight `600`.
* **Body Text**:
  * `Body Regular`: `0.9375rem` (15px), font-weight `400`, leading `1.6`.
  * `Body Small`: `0.84375rem` (13.5px), font-weight `400`, leading `1.5`.

---

## 4. Spacing & Layout Grid

* **Base Unit**: `4px` grid (`space-1` = 4px, `space-2` = 8px, `space-4` = 16px, `space-6` = 24px, `space-8` = 32px).
* **Container Max-Widths**:
  * Main Application Layout: `max-w-7xl` (`1280px`) with `px-4 sm:px-6 lg:px-8`.
  * Form Containers: `max-w-md` (`448px`) or `max-w-2xl` (`672px`).
  * Detail Views: `max-w-5xl` (`1024px`).

---

## 5. UI Component Rules & Standards

### Buttons
* **Primary**: Deep Emerald background (`#0F766E`), white text, hover brightness transform, focus ring.
* **Secondary**: Outline with border-neutral-300, hover background-muted, text-foreground.
* **Accent**: Warm Amber background (`#D97706`), white text.

### Cards & Badges
* Light border (`border border-slate-200 dark:border-slate-800`).
* Clean elevation without heavy glowing gradients.
* **Teaching Skill Badges**: Deep Emerald tint.
* **Learning Skill Badges**: Warm Amber / Soft Slate tint.

### Icon Rules
* Strictly **Lucide React** interface icons (`LayoutDashboard`, `Compass`, `Sparkles`, `GitPullRequest`, `Repeat`, `MessageCircle`, `Bell`, `User`, `Settings`, `Search`, `Menu`).
* No emojis as interface icons.

---

## 6. Dynamic Data Integrity

* **Zero Hardcoded Users**: All user details (Name, Username, Avatar/Initials, University, Degree, Skills, Stats) are queried dynamically from Supabase Auth & PostgreSQL.
* **Initials Fallback**: Generated strictly from the user's real name (e.g., `Nabeel Ijaz` -> `NI`). No static `"SU"` or `"Student User"` strings.
