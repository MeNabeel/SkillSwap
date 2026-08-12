import { createClient } from "@/lib/supabase/client";

export interface ExchangeRequestItem {
  id: string;
  sender_id: string;
  receiver_id: string;
  requested_skill_id: string;
  offered_skill_id: string;
  message: string | null;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  created_at: string;
  updated_at: string;
  sender?: any;
  receiver?: any;
  requested_skill?: any;
  offered_skill?: any;
  matchScore?: number;
}

export async function createExchangeRequest({
  senderId,
  receiverId,
  requestedSkillId,
  offeredSkillId,
  message,
}: {
  senderId: string;
  receiverId: string;
  requestedSkillId: string;
  offeredSkillId: string;
  message?: string;
}): Promise<{ success: boolean; error?: string; requestId?: string }> {
  try {
    const supabase = createClient();

    if (senderId === receiverId) {
      return { success: false, error: "You cannot request a skill exchange with yourself." };
    }

    // Check duplicate pending request
    const { data: existing } = await (supabase as any)
      .from("exchange_requests")
      .select("id")
      .eq("sender_id", senderId)
      .eq("receiver_id", receiverId)
      .eq("status", "pending")
      .single();

    if (existing) {
      return { success: false, error: "A pending request with this student already exists." };
    }

    const { data: request, error: insertError } = await (supabase as any)
      .from("exchange_requests")
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        requested_skill_id: requestedSkillId,
        offered_skill_id: offeredSkillId,
        message: message?.trim() || null,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Fetch sender profile for notification message
    const { data: senderProfile } = await (supabase as any)
      .from("profiles")
      .select("full_name")
      .eq("id", senderId)
      .single();

    const senderName = senderProfile?.full_name || "A student";

    // Insert Notification for Receiver
    await (supabase as any).from("notifications").insert({
      user_id: receiverId,
      type: "exchange_request",
      title: "New Skill Exchange Request",
      message: `${senderName} sent you a skill exchange request!`,
      reference_id: request.id,
      reference_type: "exchange_request",
      is_read: false,
    });

    return { success: true, requestId: request.id };
  } catch (err: any) {
    console.error("createExchangeRequest error:", err);
    return { success: false, error: err.message || "Failed to send exchange request." };
  }
}

export async function fetchUserRequests(userId: string): Promise<{
  incoming: ExchangeRequestItem[];
  sent: ExchangeRequestItem[];
  accepted: ExchangeRequestItem[];
  rejected: ExchangeRequestItem[];
  cancelled: ExchangeRequestItem[];
}> {
  try {
    const supabase = createClient();
    const { data, error } = await (supabase as any)
      .from("exchange_requests")
      .select("*, sender:profiles!exchange_requests_sender_id_fkey(*), receiver:profiles!exchange_requests_receiver_id_fkey(*), requested_skill:skills!exchange_requests_requested_skill_id_fkey(*), offered_skill:skills!exchange_requests_offered_skill_id_fkey(*)")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error || !data) {
      return { incoming: [], sent: [], accepted: [], rejected: [], cancelled: [] };
    }

    const incoming: ExchangeRequestItem[] = [];
    const sent: ExchangeRequestItem[] = [];
    const accepted: ExchangeRequestItem[] = [];
    const rejected: ExchangeRequestItem[] = [];
    const cancelled: ExchangeRequestItem[] = [];

    data.forEach((item: any) => {
      const isIncoming = item.receiver_id === userId;
      if (item.status === "pending") {
        if (isIncoming) incoming.push(item);
        else sent.push(item);
      } else if (item.status === "accepted") {
        accepted.push(item);
      } else if (item.status === "rejected") {
        rejected.push(item);
      } else if (item.status === "cancelled") {
        cancelled.push(item);
      }
    });

    return { incoming, sent, accepted, rejected, cancelled };
  } catch (err) {
    console.error("fetchUserRequests error:", err);
    return { incoming: [], sent: [], accepted: [], rejected: [], cancelled: [] };
  }
}

export async function acceptExchangeRequest(requestId: string, currentUserId: string): Promise<{ success: boolean; error?: string; exchangeId?: string }> {
  try {
    const supabase = createClient();

    const { data: request, error: fetchErr } = await (supabase as any)
      .from("exchange_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (fetchErr || !request) {
      return { success: false, error: "Request not found." };
    }

    if (request.receiver_id !== currentUserId) {
      return { success: false, error: "Only the request receiver can accept this exchange." };
    }

    // Update Request status to accepted
    await (supabase as any)
      .from("exchange_requests")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", requestId);

    // Create Exchange Record
    const { data: exchange, error: exchErr } = await (supabase as any)
      .from("exchanges")
      .insert({
        request_id: request.id,
        user_one_id: request.sender_id,
        user_two_id: request.receiver_id,
        teaching_skill_id: request.offered_skill_id,
        learning_skill_id: request.requested_skill_id,
        status: "active",
      })
      .select()
      .single();

    if (exchErr) throw exchErr;

    // Create Conversation Record
    const { data: conv, error: convErr } = await (supabase as any)
      .from("conversations")
      .insert({
        exchange_id: exchange.id,
      })
      .select()
      .single();

    if (convErr) throw convErr;

    // Add conversation members
    await (supabase as any).from("conversation_members").insert([
      { conversation_id: conv.id, user_id: request.sender_id },
      { conversation_id: conv.id, user_id: request.receiver_id },
    ]);

    // Send Notification to Request Sender
    const { data: receiverProfile } = await (supabase as any)
      .from("profiles")
      .select("full_name")
      .eq("id", currentUserId)
      .single();

    const receiverName = receiverProfile?.full_name || "Peer";

    await (supabase as any).from("notifications").insert({
      user_id: request.sender_id,
      type: "request_accepted",
      title: "Exchange Request Accepted!",
      message: `${receiverName} accepted your skill exchange request!`,
      reference_id: exchange.id,
      reference_type: "exchange",
      is_read: false,
    });

    return { success: true, exchangeId: exchange.id };
  } catch (err: any) {
    console.error("acceptExchangeRequest error:", err);
    return { success: false, error: err.message || "Failed to accept request." };
  }
}

export async function rejectExchangeRequest(requestId: string, currentUserId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

    const { data: request } = await (supabase as any)
      .from("exchange_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (!request || request.receiver_id !== currentUserId) {
      return { success: false, error: "Unauthorized or invalid request." };
    }

    await (supabase as any)
      .from("exchange_requests")
      .update({ status: "rejected", updated_at: new Date().toISOString() })
      .eq("id", requestId);

    // Notify sender
    await (supabase as any).from("notifications").insert({
      user_id: request.sender_id,
      type: "request_rejected",
      title: "Skill Exchange Request Update",
      message: "Your skill exchange request was declined.",
      reference_id: requestId,
      reference_type: "exchange_request",
      is_read: false,
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function cancelExchangeRequest(requestId: string, currentUserId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    await (supabase as any)
      .from("exchange_requests")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", requestId)
      .eq("sender_id", currentUserId);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
