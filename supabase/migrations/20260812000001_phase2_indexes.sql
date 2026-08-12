-- SkillSwap Phase 2 Indexing Migration
-- Speed up search, filtering, and user skill joins for Discover page queries

-- Index for searching profiles by visibility, full_name, username, university
CREATE INDEX IF NOT EXISTS idx_profiles_discover_search 
ON public.profiles(profile_visibility, onboarding_completed, full_name, username, university);

-- Index for user_teaching_skills lookups
CREATE INDEX IF NOT EXISTS idx_user_teaching_skills_user 
ON public.user_teaching_skills(user_id, skill_id);

-- Index for user_learning_skills lookups
CREATE INDEX IF NOT EXISTS idx_user_learning_skills_user 
ON public.user_learning_skills(user_id, skill_id);
