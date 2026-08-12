# SkillSwap — Design System & UI Specification

Welcome to the design system for **SkillSwap**, a peer-to-peer student skill exchange platform. This document defines the brand, layout rules, token architecture, and UI behavior required for a high-quality, production-ready full-stack application.

---

## 1. Brand Identity & Vision

* **Brand Name**: SkillSwap
* **Tagline**: Learn together. Teach together. Connect through skills.
* **Core Philosophy**: Empowering students to exchange knowledge democratically without financial barriers.
* **Visual Tone**: Modern, energetic, academic, trustworthy, clean, and accessible.

---

## 2. Color System

SkillSwap utilizes a tailored HSL-based color palette with dark/light dynamic theme support:

### Primary Colors
* **Brand Indigo (Primary)**: `hsl(238, 83%, 62%)` — Used for main brand accents, primary buttons, active tabs, active navigation states.
* **Deep Indigo Hover**: `hsl(238, 75%, 54%)`
* **Subtle Indigo Tint**: `hsl(238, 85%, 96%)` / Dark: `hsl(238, 40%, 15%)`

### Accent Colors
* **Emerald Match (Success & Compatibility)**: `hsl(160, 84%, 39%)` — Used for high match percentage badges, positive exchange confirmations, online indicators.
* **Soft Violet (AI Recommendations & Insights)**: `hsl(267, 83%, 63%)` — Used for AI-enhanced match tags, smart recommendation badges, highlight borders.
* **Warm Amber (Pending & Ratings)**: `hsl(38, 92%, 50%)` — Star ratings, pending request statuses, warning alerts.
* **Rose (Destructive & Rejected)**: `hsl(346, 84%, 61%)` — Rejected/cancelled requests, delete actions, error notifications.

### Neutral Colors
* **Background**: `hsl(210, 40%, 98%)` (Light) / `hsl(222, 47%, 11%)` (Dark)
* **Card Surface**: `hsl(0, 0%, 100%)` (Light) / `hsl(217, 33%, 17%)` (Dark)
* **Border**: `hsl(214, 32%, 91%)` (Light) / `hsl(217, 19%, 27%)` (Dark)
* **Text Primary**: `hsl(222, 47%, 11%)` (Light) / `hsl(210, 40%, 98%)` (Dark)
* **Text Muted**: `hsl(215, 16%, 47%)` (Light) / `hsl(215, 20%, 65%)` (Dark)

---

## 3. Typography

* **Font Family**: Inter, system-ui, -apple-system, sans-serif.
* **Heading Scale**:
  * `H1` (Page Title): `2.25rem` (36px), font-weight `700`, tracking `-0.025em`, leading `1.2`.
  * `H2` (Section Header): `1.75rem` (28px), font-weight `600`, tracking `-0.02em`.
  * `H3` (Card Header / Subsection): `1.25rem` (20px), font-weight `600`.
  * `H4` (Group Label): `1rem` (16px), font-weight `600`.
* **Body Text**:
  * `Body Regular`: `0.9375rem` (15px), font-weight `400`, leading `1.6`.
  * `Body Small`: `0.84375rem` (13.5px), font-weight `400`, leading `1.5`.
  * `Caption / Badge`: `0.75rem` (12px), font-weight `500`, uppercase tracking `0.05em`.

---

## 4. Spacing & Layout Grid

* **Base Unit**: `4px` grid (`space-1` = 4px, `space-2` = 8px, `space-4` = 16px, `space-6` = 24px, `space-8` = 32px).
* **Container Max-Widths**:
  * Main Application Layout: `max-w-7xl` (`1280px`) with `px-4 sm:px-6 lg:px-8`.
  * Form / Modal Containers: `max-w-md` (`448px`) or `max-w-2xl` (`672px`).
  * Detail Views: `max-w-5xl` (`1024px`).

---

## 5. Border Radius & Elevation

* **Border Radius**:
  * Cards / Containers: `0.75rem` (`12px` / `rounded-xl`).
  * Modals / Sheets: `1rem` (`16px` / `rounded-2xl`).
  * Input Fields / Buttons: `0.5rem` (`8px` / `rounded-lg`).
  * Badges / Avatars: `9999px` (`rounded-full`).
* **Shadows**:
  * `shadow-sm`: `0 1px 2px 0 rgba(0, 0, 0, 0.05)` (Default card resting state).
  * `shadow-md`: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)` (Hover state on cards, dropdown menus).
  * `shadow-lg`: `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)` (Dialogs, popovers, floating sheets).

---

## 6. UI Component Rules & Standards

### Buttons
* **Primary**: Brand Indigo background, white text, subtle hover brightness transform, focus ring.
* **Secondary**: Outline with border-neutral-300, hover background-slate-100, text-neutral-800.
* **Match / Request Action**: Emerald background or soft emerald badge fill with high contrast text.
* **Ghost**: Transparent background, text-muted-foreground, hover background-muted.
* **Destructive**: Rose background, white text.

### Cards
* Must have light border (`border border-slate-200 dark:border-slate-800`).
* Consistent padding: `p-5` or `p-6`.
* Subtle transition (`transition-all duration-200 ease-in-out`). Hover effect applies `hover:-translate-y-0.5 hover:shadow-md`.

### Skill Badges & Technology Icons
* **Teaching Skill Badges**: Emerald background tint (`bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60`).
* **Learning Skill Badges**: Indigo background tint (`bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200/60`).
* **Tech Logo Vectors**: Use official SVG vector icons for React, Python, JavaScript, TypeScript, Node.js, MongoDB, PostgreSQL, Docker, Figma, etc.
* **Interface Icons**: Strictly Lucide React icons (`Search`, `Bell`, `MessageCircle`, `User`, `Settings`, `Plus`, `Check`, `X`, `Star`, `SlidersHorizontal`, `ArrowRight`, `Sparkles`, `Filter`). No emojis for UI controls.

### Navigation
* **Desktop**: Header fixed at top with logo, nav links (`Dashboard`, `Discover`, `My Exchanges`, `Messages`), Search quick trigger, Notification bell dropdown, User Avatar & Dropdown.
* **Mobile**: Sticky header with logo & notifications + responsive slide-out Mobile Sheet or bottom tab bar (`Dashboard`, `Discover`, `Exchanges`, `Messages`, `Profile`).

---

## 7. Application States

### Loading States
* Use **shadcn/ui Skeleton** blocks matching the exact geometry of destination cards/lists.
* Never display raw blank containers or plain spinners without contextual skeleton layout.

### Empty States
* Centered layout with dedicated Lucide vector icon (e.g. `Inbox`, `Users`, `MessageSquareDashed`, `Sparkles`).
* Clear heading (e.g. "No exchange requests found").
* Supportive description text explaining why the state is empty.
* Primary action button (e.g. "Discover Students", "Complete Profile").

### Error & Success States
* **Form Errors**: Inline red error message below invalid inputs with subtle red field border.
* **API/Database Errors**: Clean toast message (`sonner`) with user-friendly language. Database stack traces or SQL codes must never be displayed to users.
* **Success Messages**: Sonner toast with green checkmark icon and affirmative feedback.

---

## 8. Accessibility Rules

* Semantic structure: `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`, `<aside>`.
* High contrast ratio (> 4.5:1 for normal body text, > 3:1 for large headers).
* Full keyboard navigation support (visible `focus-visible:ring-2 focus-visible:ring-indigo-500` rings).
* Accessible form controls with `<label htmlFor="...">` and `aria-describedby` for helper/error text.
* Screen reader announcements for tab changes, live chat updates, and toast notifications.
