export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Profile {
  id: string;
  full_name: string;
  username: string;
  avatar_url?: string | null;
  university?: string | null;
  degree?: string | null;
  semester?: string | null;
  location?: string | null;
  bio?: string | null;
  experience_level?: string | null;
  availability?: string | null;
  profile_visibility?: 'public' | 'private';
  onboarding_completed?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  icon?: string | null;
  created_at?: string;
}

export interface UserTeachingSkill {
  id?: string;
  user_id: string;
  skill_id: string;
  experience_level: string;
  created_at?: string;
  skill?: Skill;
}

export interface UserLearningSkill {
  id?: string;
  user_id: string;
  skill_id: string;
  desired_level: string;
  created_at?: string;
  skill?: Skill;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Profile;
        Update: Partial<Profile>;
      };
      skills: {
        Row: Skill;
        Insert: Skill;
        Update: Partial<Skill>;
      };
      user_teaching_skills: {
        Row: UserTeachingSkill;
        Insert: UserTeachingSkill;
        Update: Partial<UserTeachingSkill>;
      };
      user_learning_skills: {
        Row: UserLearningSkill;
        Insert: UserLearningSkill;
        Update: Partial<UserLearningSkill>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
