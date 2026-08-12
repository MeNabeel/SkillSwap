import { UserMatchProfile } from "@/lib/matching/types";

export interface DiscoverFilters {
  query?: string;
  category?: string; // 'all' or specific category
  skills?: string[]; // Array of selected skill IDs or names
  experienceLevel?: string; // 'all' or Beginner/Intermediate/Advanced/Expert
  university?: string; // 'all' or specific university
  availability?: string; // 'all' or specific availability option
  minMatchScore?: number; // 0, 50, 70, 80, 90
  sortBy?: "best_match" | "highest_rated" | "most_experienced" | "recently_joined";
  page?: number;
  pageSize?: number;
}

export interface StudentCardData extends UserMatchProfile {
  degree?: string | null;
  semester?: string | null;
  location?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  profile_visibility: "public" | "private";
  onboarding_completed: boolean;
  created_at: string;
  rating?: number | null; // e.g., 4.8 or null
  rating_count?: number; // e.g., 24
  completed_exchanges?: number; // e.g., 12
  matchScore?: number;
  matchReasons?: string[];
}

export interface PaginatedDiscoverResult {
  students: StudentCardData[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
}
