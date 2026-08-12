-- SkillSwap Schema Initialization Migration
-- Phase 1: Profiles, Skills, User Teaching Skills, User Learning Skills, RLS, Storage

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    university TEXT,
    degree TEXT,
    semester TEXT,
    location TEXT,
    bio TEXT,
    experience_level TEXT,
    availability TEXT,
    profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private')),
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create skills table
CREATE TABLE IF NOT EXISTS public.skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create user_teaching_skills table
CREATE TABLE IF NOT EXISTS public.user_teaching_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
    experience_level TEXT NOT NULL CHECK (experience_level IN ('Beginner', 'Intermediate', 'Advanced', 'Expert')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, skill_id)
);

-- 4. Create user_learning_skills table
CREATE TABLE IF NOT EXISTS public.user_learning_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
    desired_level TEXT NOT NULL CHECK (desired_level IN ('Beginner', 'Intermediate', 'Advanced', 'Expert')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, skill_id)
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_teaching_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_learning_skills ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies

-- PROFILES POLICIES
CREATE POLICY "Public profiles are readable by everyone" ON public.profiles
    FOR SELECT USING (profile_visibility = 'public' OR auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete their own profile" ON public.profiles
    FOR DELETE USING (auth.uid() = id);

-- SKILLS POLICIES
CREATE POLICY "Authenticated users can read skills" ON public.skills
    FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- USER TEACHING SKILLS POLICIES
CREATE POLICY "Users can view teaching skills" ON public.user_teaching_skills
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own teaching skills" ON public.user_teaching_skills
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own teaching skills" ON public.user_teaching_skills
    FOR DELETE USING (auth.uid() = user_id);

-- USER LEARNING SKILLS POLICIES
CREATE POLICY "Users can view learning skills" ON public.user_learning_skills
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own learning skills" ON public.user_learning_skills
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own learning skills" ON public.user_learning_skills
    FOR DELETE USING (auth.uid() = user_id);

-- 7. Seed Initial Skills
INSERT INTO public.skills (name, category, description, icon) VALUES
    ('React.js', 'Software & Web Development', 'Component-based UI library for web applications', 'react'),
    ('Next.js', 'Software & Web Development', 'Full-stack React framework with SSR and App Router', 'nextjs'),
    ('TypeScript', 'Software & Web Development', 'Typed superset of JavaScript', 'typescript'),
    ('Python', 'Software & Web Development', 'Versatile programming language for web, data, and scripting', 'python'),
    ('Node.js', 'Software & Web Development', 'JavaScript runtime environment for backend development', 'nodejs'),
    ('Data Structures & Algorithms', 'Software & Web Development', 'Core computer science problem solving and algorithms', 'code'),
    ('Figma & UI/UX Design', 'Design & Creative', 'Interface design, wireframing, and user research', 'figma'),
    ('Graphic Design', 'Design & Creative', 'Visual branding, posters, and illustration', 'palette'),
    ('Machine Learning', 'Data & AI', 'Predictive modeling, PyTorch, and Scikit-Learn', 'brain'),
    ('SQL & Databases', 'Data & AI', 'Relational database design and PostgreSQL queries', 'database'),
    ('Calculus & Linear Algebra', 'Academics & Science', 'College mathematics and problem solving', 'calculator'),
    ('Academic Writing', 'Academics & Science', 'Research papers, essays, and APA citation formatting', 'book-open'),
    ('Spanish Language', 'Languages', 'Conversational and written Spanish skills', 'languages'),
    ('English Conversation', 'Languages', 'Fluency practice and pronunciation', 'globe'),
    ('Public Speaking', 'Business & Career', 'Presentation skills and speech confidence', 'mic'),
    ('Digital Marketing', 'Business & Career', 'SEO, social media strategy, and content marketing', 'trending-up')
ON CONFLICT (name) DO NOTHING;

-- 8. Storage bucket setup policy for avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can update their own avatar" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars' AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can delete their own avatar" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'avatars' AND auth.role() = 'authenticated'
    );
