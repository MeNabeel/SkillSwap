export interface UserSkillItem {
  skillId: string;
  name: string;
  category?: string;
  level: string; // 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
}

export interface UserMatchProfile {
  id: string;
  full_name: string;
  username: string;
  university?: string | null;
  experience_level?: string | null;
  availability?: string | null;
  teaching_skills: UserSkillItem[];
  learning_skills: UserSkillItem[];
}

export interface MatchReason {
  id: string;
  text: string;
  type: "teaching" | "learning" | "experience" | "availability";
}

export interface MatchScoreResult {
  score: number; // 0 - 100
  teachingMatchCount: number;
  learningMatchCount: number;
  reasons: MatchReason[];
  matchedTeachingSkills: string[]; // Skill names target user teaches that current user wants
  matchedLearningSkills: string[]; // Skill names current user teaches that target user wants
}
