import { createClient } from "@/lib/supabase/client";
import { INITIAL_SKILLS, SeedSkill } from "@/lib/constants/skills";

export async function fetchDatabaseSkills(): Promise<SeedSkill[]> {
  try {
    const supabase = createClient();
    const { data, error } = await (supabase as any)
      .from("skills")
      .select("*")
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    if (!error && data && data.length > 0) {
      return data.map((s: any) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        description: s.description || "",
        icon: s.icon || "code",
      }));
    }
  } catch (err) {
    console.error("Fetch skills error:", err);
  }

  // Initial seed fallback if table hasn't been seeded yet
  return INITIAL_SKILLS;
}

export async function fetchSkillCategories(): Promise<string[]> {
  const skills = await fetchDatabaseSkills();
  const categories = Array.from(new Set(skills.map((s) => s.category)));
  return categories.sort();
}
