import { createClient } from "@/lib/supabase/client";

export interface UserFullProfile {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  university: string | null;
  degree: string | null;
  semester: string | null;
  location: string | null;
  bio: string | null;
  experience_level: string | null;
  availability: string | null;
  profile_visibility: "public" | "private";
  onboarding_completed: boolean;
  teaching_skills: any[];
  learning_skills: any[];
  completion_percentage: number;
}

export async function fetchUserProfile(userId: string): Promise<UserFullProfile | null> {
  try {
    const supabase = createClient();

    const { data: profile, error } = await (supabase as any)
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !profile) return null;

    const { data: teachData } = await (supabase as any)
      .from("user_teaching_skills")
      .select("*, skill:skills(*)")
      .eq("user_id", userId);

    const { data: learnData } = await (supabase as any)
      .from("user_learning_skills")
      .select("*, skill:skills(*)")
      .eq("user_id", userId);

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

    const completion = calculateProfileCompletion(profile, teaching_skills.length, learning_skills.length);

    return {
      ...profile,
      teaching_skills,
      learning_skills,
      completion_percentage: completion,
    };
  } catch (err) {
    console.error("fetchUserProfile error:", err);
    return null;
  }
}

export function calculateProfileCompletion(
  profile: any,
  teachingCount: number,
  learningCount: number
): number {
  if (!profile) return 0;

  const weights = [
    { field: profile.full_name, weight: 15 },
    { field: profile.username, weight: 15 },
    { field: profile.avatar_url, weight: 15 },
    { field: profile.university, weight: 10 },
    { field: profile.degree, weight: 10 },
    { field: profile.bio, weight: 10 },
    { field: profile.availability, weight: 5 },
    { field: teachingCount > 0 ? "yes" : null, weight: 10 },
    { field: learningCount > 0 ? "yes" : null, weight: 10 },
  ];

  const total = weights.reduce((acc, curr) => {
    return acc + (curr.field ? curr.weight : 0);
  }, 0);

  return Math.min(100, Math.max(0, total));
}

export async function fetchDistinctUniversities(): Promise<string[]> {
  try {
    const supabase = createClient();
    const { data } = await (supabase as any)
      .from("profiles")
      .select("university")
      .eq("profile_visibility", "public")
      .not("university", "is", null);

    if (data && data.length > 0) {
      const unis = Array.from(
        new Set(data.map((p: any) => p.university).filter(Boolean))
      ) as string[];
      return unis.sort();
    }
  } catch (err) {
    console.error("fetchDistinctUniversities error:", err);
  }
  return [];
}
