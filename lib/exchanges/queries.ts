import { createClient } from "@/lib/supabase/client";

export interface ExchangeItem {
  id: string;
  request_id: string;
  user_one_id: string;
  user_two_id: string;
  teaching_skill_id: string;
  learning_skill_id: string;
  status: "active" | "completed" | "cancelled";
  started_at: string;
  completed_at: string | null;
  created_at: string;
  user_one?: any;
  user_two?: any;
  teaching_skill?: any;
  learning_skill?: any;
  peerUser?: any;
  conversation_id?: string;
  hasRated?: boolean;
}

export async function fetchUserExchanges(userId: string): Promise<{
  active: ExchangeItem[];
  completed: ExchangeItem[];
  cancelled: ExchangeItem[];
}> {
  try {
    const supabase = createClient();

    // 1. Auto-heal check for any accepted requests missing exchange records
    const { data: acceptedRequests } = await (supabase as any)
      .from("exchange_requests")
      .select("*")
      .eq("status", "accepted")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

    if (acceptedRequests && acceptedRequests.length > 0) {
      for (const req of acceptedRequests) {
        const { data: existing } = await (supabase as any)
          .from("exchanges")
          .select("id")
          .eq("request_id", req.id)
          .maybeSingle();

        if (!existing) {
          const { data: newExch } = await (supabase as any)
            .from("exchanges")
            .insert({
              request_id: req.id,
              user_one_id: req.sender_id,
              user_two_id: req.receiver_id,
              teaching_skill_id: req.offered_skill_id,
              learning_skill_id: req.requested_skill_id,
              status: "active",
            })
            .select()
            .single();

          if (newExch) {
            const { data: conv } = await (supabase as any)
              .from("conversations")
              .insert({ exchange_id: newExch.id })
              .select()
              .single();

            if (conv) {
              await (supabase as any).from("conversation_members").insert([
                { conversation_id: conv.id, user_id: req.sender_id },
                { conversation_id: conv.id, user_id: req.receiver_id },
              ]);
            }
          }
        }
      }
    }

    // 2. Query exchanges for current user
    const { data, error } = await (supabase as any)
      .from("exchanges")
      .select("*, user_one:profiles!exchanges_user_one_id_fkey(*), user_two:profiles!exchanges_user_two_id_fkey(*), teaching_skill:skills!exchanges_teaching_skill_id_fkey(*), learning_skill:skills!exchanges_learning_skill_id_fkey(*)")
      .or(`user_one_id.eq.${userId},user_two_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error || !data) return { active: [], completed: [], cancelled: [] };

    // Fetch user ratings to check hasRated status
    const { data: userRatings } = await (supabase as any)
      .from("ratings")
      .select("exchange_id")
      .eq("reviewer_id", userId);

    const ratedExchangeIds = new Set((userRatings || []).map((r: any) => r.exchange_id));

    const active: ExchangeItem[] = [];
    const completed: ExchangeItem[] = [];
    const cancelled: ExchangeItem[] = [];

    data.forEach((item: any) => {
      const peerUser = item.user_one_id === userId ? item.user_two : item.user_one;

      const formatted: ExchangeItem = {
        ...item,
        peerUser,
        hasRated: ratedExchangeIds.has(item.id),
      };

      if (item.status === "active") active.push(formatted);
      else if (item.status === "completed") completed.push(formatted);
      else if (item.status === "cancelled") cancelled.push(formatted);
    });

    return { active, completed, cancelled };
  } catch (err) {
    console.error("fetchUserExchanges error:", err);
    return { active: [], completed: [], cancelled: [] };
  }
}

export async function fetchExchangeById(exchangeId: string, userId: string): Promise<ExchangeItem | null> {
  try {
    const supabase = createClient();
    const selectQuery = "*, user_one:profiles!exchanges_user_one_id_fkey(*), user_two:profiles!exchanges_user_two_id_fkey(*), teaching_skill:skills!exchanges_teaching_skill_id_fkey(*), learning_skill:skills!exchanges_learning_skill_id_fkey(*)";

    let { data } = await (supabase as any)
      .from("exchanges")
      .select(selectQuery)
      .eq("id", exchangeId)
      .maybeSingle();

    if (!data) {
      const { data: dataByReq } = await (supabase as any)
        .from("exchanges")
        .select(selectQuery)
        .eq("request_id", exchangeId)
        .maybeSingle();
      data = dataByReq;
    }

    if (!data) return null;

    if (data.user_one_id !== userId && data.user_two_id !== userId) {
      return null;
    }

    const peerUser = data.user_one_id === userId ? data.user_two : data.user_one;

    const { data: rating } = await (supabase as any)
      .from("ratings")
      .select("id")
      .eq("exchange_id", data.id)
      .eq("reviewer_id", userId)
      .maybeSingle();

    return {
      ...data,
      peerUser,
      hasRated: !!rating,
    };
  } catch (err) {
    console.error("fetchExchangeById error:", err);
    return null;
  }
}

export async function completeExchange(exchangeId: string, currentUserId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

    const { data: exchange } = await (supabase as any)
      .from("exchanges")
      .select("*")
      .eq("id", exchangeId)
      .single();

    if (!exchange || (exchange.user_one_id !== currentUserId && exchange.user_two_id !== currentUserId)) {
      return { success: false, error: "Unauthorized." };
    }

    await (supabase as any)
      .from("exchanges")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", exchangeId);

    const peerId = exchange.user_one_id === currentUserId ? exchange.user_two_id : exchange.user_one_id;

    // Send Notification to Peer
    const { data: actorProfile } = await (supabase as any)
      .from("profiles")
      .select("full_name")
      .eq("id", currentUserId)
      .single();

    const actorName = actorProfile?.full_name || "Your exchange partner";

    await (supabase as any).from("notifications").insert({
      user_id: peerId,
      type: "exchange_completed",
      title: "Skill Exchange Completed!",
      message: `${actorName} marked your skill exchange as completed. You can now leave a review!`,
      reference_id: exchangeId,
      reference_type: "exchange",
      is_read: false,
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to complete exchange." };
  }
}
