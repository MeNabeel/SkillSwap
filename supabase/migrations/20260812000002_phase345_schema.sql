-- ============================================================
-- SKILLSWAP PHASE 3, 4, 5 DATABASE SCHEMA MIGRATION
-- ============================================================

-- 1. Create exchange_requests table
CREATE TABLE IF NOT EXISTS public.exchange_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    requested_skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
    offered_skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create exchanges table
CREATE TABLE IF NOT EXISTS public.exchanges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES public.exchange_requests(id) ON DELETE CASCADE NOT NULL UNIQUE,
    user_one_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    user_two_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    teaching_skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
    learning_skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exchange_id UUID REFERENCES public.exchanges(id) ON DELETE CASCADE NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create conversation_members table
CREATE TABLE IF NOT EXISTS public.conversation_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

-- 5. Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('exchange_request', 'request_accepted', 'request_rejected', 'new_message', 'exchange_completed', 'rating_received', 'new_match')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    reference_id UUID,
    reference_type TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create ratings table
CREATE TABLE IF NOT EXISTS public.ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exchange_id UUID REFERENCES public.exchanges(id) ON DELETE CASCADE NOT NULL,
    reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    reviewed_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exchange_id, reviewer_id)
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

ALTER TABLE public.exchange_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- exchange_requests policies
CREATE POLICY "Users can view exchange requests they are involved in" ON public.exchange_requests
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Authenticated users can create requests" ON public.exchange_requests
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update requests they are involved in" ON public.exchange_requests
    FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- exchanges policies
CREATE POLICY "Users can view their own exchanges" ON public.exchanges
    FOR SELECT USING (auth.uid() = user_one_id OR auth.uid() = user_two_id);

CREATE POLICY "Users can update their own exchanges" ON public.exchanges
    FOR UPDATE USING (auth.uid() = user_one_id OR auth.uid() = user_two_id);

CREATE POLICY "Users can insert exchange if participant" ON public.exchanges
    FOR INSERT WITH CHECK (auth.uid() = user_one_id OR auth.uid() = user_two_id);

-- conversations policies
CREATE POLICY "Conversation members can view conversations" ON public.conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversation_members cm
            WHERE cm.conversation_id = id AND cm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert conversations for their exchange" ON public.conversations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.exchanges e
            WHERE e.id = exchange_id AND (e.user_one_id = auth.uid() OR e.user_two_id = auth.uid())
        )
    );

-- conversation_members policies
CREATE POLICY "Members can view member list" ON public.conversation_members
    FOR SELECT USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.conversation_members cm WHERE cm.conversation_id = conversation_id AND cm.user_id = auth.uid()
    ));

CREATE POLICY "Members can join conversation" ON public.conversation_members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversations c
            JOIN public.exchanges e ON c.exchange_id = e.id
            WHERE c.id = conversation_id AND (e.user_one_id = auth.uid() OR e.user_two_id = auth.uid())
        )
    );

-- messages policies
CREATE POLICY "Conversation members can view messages" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversation_members cm
            WHERE cm.conversation_id = conversation_id AND cm.user_id = auth.uid()
        )
    );

CREATE POLICY "Conversation members can send messages" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND EXISTS (
            SELECT 1 FROM public.conversation_members cm
            WHERE cm.conversation_id = conversation_id AND cm.user_id = auth.uid()
        )
    );

CREATE POLICY "Conversation members can update messages" ON public.messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.conversation_members cm
            WHERE cm.conversation_id = conversation_id AND cm.user_id = auth.uid()
        )
    );

-- notifications policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can send notifications to peers" ON public.notifications
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid());

-- ratings policies
CREATE POLICY "Everyone can view ratings" ON public.ratings
    FOR SELECT USING (true);

CREATE POLICY "Completed exchange participants can submit rating" ON public.ratings
    FOR INSERT WITH CHECK (
        auth.uid() = reviewer_id AND EXISTS (
            SELECT 1 FROM public.exchanges e
            WHERE e.id = exchange_id AND e.status = 'completed' AND (e.user_one_id = auth.uid() OR e.user_two_id = auth.uid())
        )
    );

-- Enable Supabase Realtime for Messages and Notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
