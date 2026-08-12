import { createClient } from "@/lib/supabase/client";
import { DiscoverFilters, StudentCardData, PaginatedDiscoverResult } from "./types";
import { calculateMatchScore } from "@/lib/matching/match-score";
import { formatMatchReasons } from "@/lib/matching/match-reasons";
import { UserMatchProfile } from "@/lib/matching/types";

export async function fetchDiscoverStudents(
  filters: DiscoverFilters,
  currentUserProfile?: UserMatchProfile | null
): Promise<PaginatedDiscoverResult> {
  const {
    query = "",
    category = "all",
    skills = [],
    experienceLevel = "all",
    university = "all",
    availability = "all",
    minMatchScore = 0,
    sortBy = "best_match",
    page = 1,
    pageSize = 20,
  } = filters;

  let allStudents: StudentCardData[] = [];

  try {
    const supabase = createClient();
    // Query public profiles from Supabase where onboarding_completed is true
    const { data: dbProfiles, error } = await (supabase as any)
      .from("profiles")
      .select("*")
      .eq("profile_visibility", "public")
      .eq("onboarding_completed", true);

    if (!error && dbProfiles && dbProfiles.length > 0) {
      // Fetch skills for each profile
      const studentPromises = dbProfiles.map(async (p: any) => {
        const { data: teachData } = await (supabase as any)
          .from("user_teaching_skills")
          .select("*, skill:skills(*)")
          .eq("user_id", p.id);

        const { data: learnData } = await (supabase as any)
          .from("user_learning_skills")
          .select("*, skill:skills(*)")
          .eq("user_id", p.id);

        const teaching_skills = (teachData || []).map((t: any) => ({
          skillId: t.skill_id,
          name: t.skill?.name || "Skill",
          category: t.skill?.category || "General",
          level: t.experience_level,
        }));

        const learning_skills = (learnData || []).map((l: any) => ({
          skillId: l.skill_id,
          name: l.skill?.name || "Skill",
          category: l.skill?.category || "General",
          level: l.desired_level,
        }));

        return {
          id: p.id,
          full_name: p.full_name,
          username: p.username,
          avatar_url: p.avatar_url,
          university: p.university,
          degree: p.degree,
          semester: p.semester,
          location: p.location,
          bio: p.bio,
          experience_level: p.experience_level,
          availability: p.availability,
          profile_visibility: p.profile_visibility || "public",
          onboarding_completed: p.onboarding_completed || true,
          created_at: p.created_at || new Date().toISOString(),
          rating: null,
          rating_count: 0,
          completed_exchanges: 0,
          teaching_skills,
          learning_skills,
        } as StudentCardData;
      });

      allStudents = await Promise.all(studentPromises);
    } else if (error) {
      console.error("Discover database query error:", error);
    }
  } catch (err) {
    console.error("Fetch discover students error:", err);
  }

  // Calculate Match Scores for all students against currentUserProfile
  let processedStudents = allStudents.map((student) => {
    const matchResult = calculateMatchScore(currentUserProfile, student);
    return {
      ...student,
      matchScore: matchResult.score,
      matchReasons: formatMatchReasons(matchResult.reasons),
    };
  });

  // Exclude current user from discover list
  if (currentUserProfile?.id) {
    processedStudents = processedStudents.filter((s) => s.id !== currentUserProfile.id);
  }

  // 1. Text Search Filter (name, username, university, skills)
  if (query.trim()) {
    const q = query.toLowerCase().trim();
    processedStudents = processedStudents.filter((s) => {
      const matchName = s.full_name.toLowerCase().includes(q);
      const matchUser = s.username.toLowerCase().includes(q);
      const matchUni = (s.university || "").toLowerCase().includes(q);
      const matchTeach = s.teaching_skills.some(
        (ts) => ts.name.toLowerCase().includes(q) || (ts.category && ts.category.toLowerCase().includes(q))
      );
      const matchLearn = s.learning_skills.some(
        (ls) => ls.name.toLowerCase().includes(q) || (ls.category && ls.category.toLowerCase().includes(q))
      );

      return matchName || matchUser || matchUni || matchTeach || matchLearn;
    });
  }

  // 2. Category Filter
  if (category !== "all") {
    processedStudents = processedStudents.filter((s) =>
      s.teaching_skills.some((ts) => ts.category === category) ||
      s.learning_skills.some((ls) => ls.category === category)
    );
  }

  // 3. Skills Filter (Array of skill IDs or Names)
  if (skills.length > 0) {
    processedStudents = processedStudents.filter((s) =>
      s.teaching_skills.some((ts) => skills.includes(ts.name) || skills.includes(ts.skillId)) ||
      s.learning_skills.some((ls) => skills.includes(ls.name) || skills.includes(ls.skillId))
    );
  }

  // 4. Experience Level Filter
  if (experienceLevel !== "all") {
    processedStudents = processedStudents.filter(
      (s) => s.experience_level === experienceLevel
    );
  }

  // 5. University Filter
  if (university !== "all") {
    processedStudents = processedStudents.filter(
      (s) => (s.university || "").toLowerCase() === university.toLowerCase()
    );
  }

  // 6. Availability Filter
  if (availability !== "all") {
    processedStudents = processedStudents.filter(
      (s) => (s.availability || "").toLowerCase() === availability.toLowerCase()
    );
  }

  // 7. Minimum Match Score Filter
  if (minMatchScore > 0) {
    processedStudents = processedStudents.filter(
      (s) => (s.matchScore || 0) >= minMatchScore
    );
  }

  // 8. Sorting Logic
  processedStudents.sort((a, b) => {
    if (sortBy === "best_match") {
      return (b.matchScore || 0) - (a.matchScore || 0);
    } else if (sortBy === "highest_rated") {
      return (b.rating || 0) - (a.rating || 0);
    } else if (sortBy === "most_experienced") {
      const rankMap: Record<string, number> = { Expert: 4, Advanced: 3, Intermediate: 2, Beginner: 1 };
      return (rankMap[b.experience_level || "Beginner"] || 0) - (rankMap[a.experience_level || "Beginner"] || 0);
    } else if (sortBy === "recently_joined") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    return 0;
  });

  // 9. Pagination Logic
  const totalCount = processedStudents.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const validPage = Math.max(1, Math.min(page, totalPages));
  const startIndex = (validPage - 1) * pageSize;
  const paginatedStudents = processedStudents.slice(startIndex, startIndex + pageSize);

  return {
    students: paginatedStudents,
    totalCount,
    currentPage: validPage,
    totalPages,
    pageSize,
  };
}

export async function fetchStudentById(
  id: string,
  currentUserProfile?: UserMatchProfile | null
): Promise<StudentCardData | null> {
  try {
    const supabase = createClient();
    const { data: p, error } = await (supabase as any)
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !p) {
      return null;
    }

    // Check visibility at data access level (RLS & privacy)
    if (p.profile_visibility === "private" && currentUserProfile?.id !== p.id) {
      return null;
    }

    const { data: teachData } = await (supabase as any)
      .from("user_teaching_skills")
      .select("*, skill:skills(*)")
      .eq("user_id", p.id);

    const { data: learnData } = await (supabase as any)
      .from("user_learning_skills")
      .select("*, skill:skills(*)")
      .eq("user_id", p.id);

    const teaching_skills = (teachData || []).map((t: any) => ({
      skillId: t.skill_id,
      name: t.skill?.name || "Skill",
      category: t.skill?.category || "General",
      level: t.experience_level,
    }));

    const learning_skills = (learnData || []).map((l: any) => ({
      skillId: l.skill_id,
      name: l.skill?.name || "Skill",
      category: l.skill?.category || "General",
      level: l.desired_level,
    }));

    const studentData: StudentCardData = {
      id: p.id,
      full_name: p.full_name,
      username: p.username,
      avatar_url: p.avatar_url,
      university: p.university,
      degree: p.degree,
      semester: p.semester,
      location: p.location,
      bio: p.bio,
      experience_level: p.experience_level,
      availability: p.availability,
      profile_visibility: p.profile_visibility || "public",
      onboarding_completed: p.onboarding_completed || true,
      created_at: p.created_at || new Date().toISOString(),
      rating: null,
      rating_count: 0,
      completed_exchanges: 0,
      teaching_skills,
      learning_skills,
    };

    const matchResult = calculateMatchScore(currentUserProfile, studentData);

    return {
      ...studentData,
      matchScore: matchResult.score,
      matchReasons: formatMatchReasons(matchResult.reasons),
    };
  } catch (err) {
    console.error("Fetch student by id error:", err);
    return null;
  }
}
