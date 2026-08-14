-- ============================================================
-- SKILLSWAP EXCHANGE WORKSPACE MIGRATION
-- Tables: learning_plans, learning_topics, topic_resources, sessions
-- ============================================================

-- 1. Alter exchanges table to support mutual completion confirmation
ALTER TABLE public.exchanges 
ADD COLUMN IF NOT EXISTS user_one_confirmed_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS user_two_confirmed_completed BOOLEAN DEFAULT FALSE;

-- 2. Create learning_plans table
CREATE TABLE IF NOT EXISTS public.learning_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exchange_id UUID REFERENCES public.exchanges(id) ON DELETE CASCADE NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create learning_topics table
CREATE TABLE IF NOT EXISTS public.learning_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    learning_plan_id UUID REFERENCES public.learning_plans(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'NOT_STARTED' CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED')),
    user_one_completed BOOLEAN DEFAULT FALSE,
    user_two_completed BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create topic_resources table
CREATE TABLE IF NOT EXISTS public.topic_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID REFERENCES public.learning_topics(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    resource_type TEXT NOT NULL DEFAULT 'LINK' CHECK (resource_type IN ('LINK', 'FILE', 'VIDEO', 'DOCUMENT', 'GITHUB', 'OTHER')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exchange_id UUID REFERENCES public.exchanges(id) ON DELETE CASCADE NOT NULL,
    topic_id UUID REFERENCES public.learning_topics(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    scheduled_date DATE NOT NULL,
    start_time TEXT NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED')),
    jitsi_room_name TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

ALTER TABLE public.learning_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is a member of an exchange
CREATE OR REPLACE FUNCTION public.is_exchange_participant(exchange_id_param UUID, user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.exchanges 
        WHERE id = exchange_id_param 
        AND (user_one_id = user_id_param OR user_two_id = user_id_param)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- learning_plans RLS policies
CREATE POLICY "Participants can view learning plans" ON public.learning_plans
    FOR SELECT USING (
        public.is_exchange_participant(exchange_id, auth.uid())
    );

CREATE POLICY "Participants can create learning plans" ON public.learning_plans
    FOR INSERT WITH CHECK (
        public.is_exchange_participant(exchange_id, auth.uid())
    );

CREATE POLICY "Participants can update learning plans" ON public.learning_plans
    FOR UPDATE USING (
        public.is_exchange_participant(exchange_id, auth.uid())
    );

-- learning_topics RLS policies
CREATE POLICY "Participants can view topics" ON public.learning_topics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.learning_plans lp
            WHERE lp.id = learning_plan_id 
            AND public.is_exchange_participant(lp.exchange_id, auth.uid())
        )
    );

CREATE POLICY "Participants can insert topics" ON public.learning_topics
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.learning_plans lp
            WHERE lp.id = learning_plan_id 
            AND public.is_exchange_participant(lp.exchange_id, auth.uid())
        )
    );

CREATE POLICY "Participants can update topics" ON public.learning_topics
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.learning_plans lp
            WHERE lp.id = learning_plan_id 
            AND public.is_exchange_participant(lp.exchange_id, auth.uid())
        )
    );

CREATE POLICY "Participants can delete topics" ON public.learning_topics
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.learning_plans lp
            WHERE lp.id = learning_plan_id 
            AND public.is_exchange_participant(lp.exchange_id, auth.uid())
        )
    );

-- topic_resources RLS policies
CREATE POLICY "Participants can view resources" ON public.topic_resources
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.learning_topics lt
            JOIN public.learning_plans lp ON lt.learning_plan_id = lp.id
            WHERE lt.id = topic_id 
            AND public.is_exchange_participant(lp.exchange_id, auth.uid())
        )
    );

CREATE POLICY "Participants can insert resources" ON public.topic_resources
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.learning_topics lt
            JOIN public.learning_plans lp ON lt.learning_plan_id = lp.id
            WHERE lt.id = topic_id 
            AND public.is_exchange_participant(lp.exchange_id, auth.uid())
        )
    );

CREATE POLICY "Participants can delete resources" ON public.topic_resources
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.learning_topics lt
            JOIN public.learning_plans lp ON lt.learning_plan_id = lp.id
            WHERE lt.id = topic_id 
            AND public.is_exchange_participant(lp.exchange_id, auth.uid())
        )
    );

-- sessions RLS policies
CREATE POLICY "Participants can view sessions" ON public.sessions
    FOR SELECT USING (
        public.is_exchange_participant(exchange_id, auth.uid())
    );

CREATE POLICY "Participants can insert sessions" ON public.sessions
    FOR INSERT WITH CHECK (
        public.is_exchange_participant(exchange_id, auth.uid())
    );

CREATE POLICY "Participants can update sessions" ON public.sessions
    FOR UPDATE USING (
        public.is_exchange_participant(exchange_id, auth.uid())
    );

CREATE POLICY "Participants can delete sessions" ON public.sessions
    FOR DELETE USING (
        public.is_exchange_participant(exchange_id, auth.uid())
    );
