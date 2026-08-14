import { createClient } from "@/lib/supabase/client";
import { sendSessionScheduledEmail } from "@/lib/email/resend";

export interface TopicResourceItem {
  id: string;
  topic_id: string;
  title: string;
  url: string;
  resource_type: "LINK" | "FILE" | "VIDEO" | "DOCUMENT" | "GITHUB" | "OTHER";
  created_by?: string;
  created_at: string;
}

export interface LearningTopicItem {
  id: string;
  learning_plan_id: string;
  title: string;
  description: string | null;
  order_index: number;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  user_one_completed: boolean;
  user_two_completed: boolean;
  completed_at: string | null;
  created_at: string;
  resources: TopicResourceItem[];
}

export interface LearningPlanItem {
  id: string;
  exchange_id: string;
  title: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
  topics: LearningTopicItem[];
}

export interface LearningSessionItem {
  id: string;
  exchange_id: string;
  topic_id: string | null;
  title: string;
  scheduled_date: string;
  start_time: string;
  duration_minutes: number;
  notes: string | null;
  status: "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED";
  jitsi_room_name: string;
  created_by: string | null;
  completed_at: string | null;
  created_at: string;
  topic?: LearningTopicItem;
}

export interface WorkspaceData {
  exchange: any;
  peerUser: any;
  userRole: "user_one" | "user_two";
  plan: LearningPlanItem | null;
  sessions: LearningSessionItem[];
  upcomingSession: LearningSessionItem | null;
  progressPercent: number;
  totalTopics: number;
  completedTopics: number;
  isMutualComplete: boolean;
  hasRated: boolean;
}

export async function fetchWorkspaceData(
  exchangeId: string,
  currentUserId: string
): Promise<WorkspaceData | null> {
  try {
    const supabase = createClient();

    const selectQuery = "*, user_one:profiles!exchanges_user_one_id_fkey(*), user_two:profiles!exchanges_user_two_id_fkey(*), teaching_skill:skills!exchanges_teaching_skill_id_fkey(*), learning_skill:skills!exchanges_learning_skill_id_fkey(*)";

    // 1. Query exchange record by id OR by request_id
    let { data: exchange } = await (supabase as any)
      .from("exchanges")
      .select(selectQuery)
      .eq("id", exchangeId)
      .maybeSingle();

    if (!exchange) {
      // Lookup by request_id
      const { data: exchByReq } = await (supabase as any)
        .from("exchanges")
        .select(selectQuery)
        .eq("request_id", exchangeId)
        .maybeSingle();

      if (exchByReq) {
        exchange = exchByReq;
      } else {
        // Auto-heal: If exchangeId is a request_id for an accepted request, create exchange record now
        const { data: req } = await (supabase as any)
          .from("exchange_requests")
          .select("*")
          .eq("id", exchangeId)
          .maybeSingle();

        if (req && (req.sender_id === currentUserId || req.receiver_id === currentUserId)) {
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

            const { data: fullNewExch } = await (supabase as any)
              .from("exchanges")
              .select(selectQuery)
              .eq("id", newExch.id)
              .single();

            exchange = fullNewExch;
          }
        }
      }
    }

    if (!exchange) return null;

    if (exchange.user_one_id !== currentUserId && exchange.user_two_id !== currentUserId) {
      return null; // Security RLS check
    }

    const userRole: "user_one" | "user_two" = exchange.user_one_id === currentUserId ? "user_one" : "user_two";
    const peerUser = userRole === "user_one" ? exchange.user_two : exchange.user_one;

    // Check rating status
    const { data: rating } = await (supabase as any)
      .from("ratings")
      .select("id")
      .eq("exchange_id", exchange.id)
      .eq("reviewer_id", currentUserId)
      .maybeSingle();

    // 2. Query Learning Plan
    const { data: planData } = await (supabase as any)
      .from("learning_plans")
      .select("*")
      .eq("exchange_id", exchange.id)
      .maybeSingle();

    let plan: LearningPlanItem | null = null;
    let totalTopics = 0;
    let completedTopics = 0;

    if (planData) {
      // Query topics
      const { data: topicsData } = await (supabase as any)
        .from("learning_topics")
        .select("*")
        .eq("learning_plan_id", planData.id)
        .order("order_index", { ascending: true });

      const topicsList: LearningTopicItem[] = [];

      if (topicsData && topicsData.length > 0) {
        totalTopics = topicsData.length;

        // Batch fetch resources for topics
        const topicIds = topicsData.map((t: any) => t.id);
        const { data: resourcesData } = await (supabase as any)
          .from("topic_resources")
          .select("*")
          .in("topic_id", topicIds)
          .order("created_at", { ascending: true });

        const resourceMap = new Map<string, TopicResourceItem[]>();
        (resourcesData || []).forEach((r: any) => {
          const list = resourceMap.get(r.topic_id) || [];
          list.push(r);
          resourceMap.set(r.topic_id, list);
        });

        topicsData.forEach((t: any) => {
          const isCompleted = Boolean(t.user_one_completed && t.user_two_completed);
          if (isCompleted) completedTopics++;

          topicsList.push({
            ...t,
            status: isCompleted ? "COMPLETED" : t.user_one_completed || t.user_two_completed ? "IN_PROGRESS" : "NOT_STARTED",
            resources: resourceMap.get(t.id) || [],
          });
        });
      }

      plan = {
        ...planData,
        topics: topicsList,
      };
    }

    const progressPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    // 3. Query Sessions
    const { data: sessionsData } = await (supabase as any)
      .from("sessions")
      .select("*")
      .eq("exchange_id", exchange.id)
      .order("scheduled_date", { ascending: true });

    const sessions: LearningSessionItem[] = sessionsData || [];

    const upcomingSession =
      sessions.find(
        (s) => s.status === "SCHEDULED" || s.status === "LIVE"
      ) || null;

    const isMutualComplete = Boolean(
      exchange.user_one_confirmed_completed && exchange.user_two_confirmed_completed
    );

    return {
      exchange,
      peerUser,
      userRole,
      plan,
      sessions,
      upcomingSession,
      progressPercent,
      totalTopics,
      completedTopics,
      isMutualComplete,
      hasRated: !!rating,
    };
  } catch (err) {
    console.error("fetchWorkspaceData error:", err);
    return null;
  }
}

export async function createManualLearningPlan(
  exchangeId: string,
  currentUserId: string,
  title: string,
  description: string,
  topics: { title: string; description?: string }[]
): Promise<{ success: boolean; planId?: string; error?: string }> {
  try {
    const supabase = createClient();

    // Insert plan
    const { data: plan, error: planErr } = await (supabase as any)
      .from("learning_plans")
      .insert({
        exchange_id: exchangeId,
        title: title.trim(),
        description: description.trim() || null,
        created_by: currentUserId,
      })
      .select()
      .single();

    if (planErr || !plan) {
      return { success: false, error: planErr?.message || "Failed to create learning plan." };
    }

    // Insert initial topics if provided
    if (topics && topics.length > 0) {
      const topicInserts = topics.map((t, idx) => ({
        learning_plan_id: plan.id,
        title: t.title.trim(),
        description: t.description?.trim() || null,
        order_index: idx + 1,
        created_by: currentUserId,
      }));

      await (supabase as any).from("learning_topics").insert(topicInserts);
    }

    return { success: true, planId: plan.id };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create learning plan." };
  }
}

export async function deleteLearningPlan(
  planId: string,
  exchangeId: string,
  currentUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { error } = await (supabase as any)
      .from("learning_plans")
      .delete()
      .eq("id", planId)
      .eq("exchange_id", exchangeId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete learning plan." };
  }
}

export async function createLearningTopic(
  learningPlanId: string,
  currentUserId: string,
  title: string,
  description?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

    const { count } = await (supabase as any)
      .from("learning_topics")
      .select("id", { count: "exact", head: true })
      .eq("learning_plan_id", learningPlanId);

    const nextIndex = (count || 0) + 1;

    const { error } = await (supabase as any).from("learning_topics").insert({
      learning_plan_id: learningPlanId,
      title: title.trim(),
      description: description?.trim() || null,
      order_index: nextIndex,
      created_by: currentUserId,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to add topic." };
  }
}

export async function deleteLearningTopic(
  topicId: string,
  currentUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { error } = await (supabase as any)
      .from("learning_topics")
      .delete()
      .eq("id", topicId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete topic." };
  }
}

export async function toggleTopicStudentCompletion(
  topicId: string,
  exchangeId: string,
  currentUserId: string,
  userRole: "user_one" | "user_two"
): Promise<{ success: boolean; isNowCompleted?: boolean; error?: string }> {
  try {
    const supabase = createClient();

    const { data: topic } = await (supabase as any)
      .from("learning_topics")
      .select("*")
      .eq("id", topicId)
      .single();

    if (!topic) return { success: false, error: "Topic not found." };

    const isUserOne = userRole === "user_one";
    const newOneVal = isUserOne ? !topic.user_one_completed : topic.user_one_completed;
    const newTwoVal = !isUserOne ? !topic.user_two_completed : topic.user_two_completed;

    const isNowCompleted = newOneVal && newTwoVal;
    const newStatus = isNowCompleted ? "COMPLETED" : newOneVal || newTwoVal ? "IN_PROGRESS" : "NOT_STARTED";

    const { error } = await (supabase as any)
      .from("learning_topics")
      .update({
        user_one_completed: newOneVal,
        user_two_completed: newTwoVal,
        status: newStatus,
        completed_at: isNowCompleted ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", topicId);

    if (error) return { success: false, error: error.message };
    return { success: true, isNowCompleted };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update topic completion." };
  }
}

export async function addTopicResource(
  topicId: string,
  currentUserId: string,
  title: string,
  url: string,
  resourceType: "LINK" | "FILE" | "VIDEO" | "DOCUMENT" | "GITHUB" | "OTHER" = "LINK"
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

    const { error } = await (supabase as any).from("topic_resources").insert({
      topic_id: topicId,
      title: title.trim(),
      url: url.trim(),
      resource_type: resourceType,
      created_by: currentUserId,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to add resource." };
  }
}

export async function scheduleLearningSession(
  exchangeId: string,
  currentUserId: string,
  topicId: string | null,
  title: string,
  scheduledDate: string,
  startTime: string,
  durationMinutes: number = 60,
  notes?: string
): Promise<{ success: boolean; sessionId?: string; emailSent?: boolean; error?: string }> {
  try {
    const supabase = createClient();

    const cleanRoomName = `skillswap-exchange-${exchangeId.slice(0, 8)}-${Date.now().toString(36)}`;

    const { data: session, error } = await (supabase as any)
      .from("sessions")
      .insert({
        exchange_id: exchangeId,
        topic_id: topicId || null,
        title: title.trim(),
        scheduled_date: scheduledDate,
        start_time: startTime,
        duration_minutes: durationMinutes,
        notes: notes?.trim() || null,
        status: "SCHEDULED",
        jitsi_room_name: cleanRoomName,
        created_by: currentUserId,
      })
      .select()
      .single();

    if (error || !session) return { success: false, error: error?.message || "Failed to schedule session." };

    // Send Notification & Email Reminder Dispatch
    const { data: exchange } = await (supabase as any)
      .from("exchanges")
      .select("user_one_id, user_two_id")
      .eq("id", exchangeId)
      .single();

    if (exchange) {
      const peerId = exchange.user_one_id === currentUserId ? exchange.user_two_id : exchange.user_one_id;
      
      const { data: currentAuthUser } = await supabase.auth.getUser();
      const userEmail = currentAuthUser.user?.email || "student@university.edu";

      // Insert In-App Notifications for both participants
      await (supabase as any).from("notifications").insert([
        {
          user_id: currentUserId,
          type: "exchange_request",
          title: "Session Scheduled",
          message: `Your learning session "${title}" is scheduled for ${scheduledDate} at ${startTime}. Email notification sent to ${userEmail}.`,
          reference_id: session.id,
          reference_type: "session",
          is_read: false,
        },
        {
          user_id: peerId,
          type: "exchange_request",
          title: "New Session Scheduled",
          message: `Your partner scheduled a new learning session: "${title}" for ${scheduledDate} at ${startTime}.`,
          reference_id: session.id,
          reference_type: "session",
          is_read: false,
        },
      ]);

      // Trigger Resend email dispatch
      if (currentAuthUser.user?.email) {
        await sendSessionScheduledEmail({
          recipientEmail: currentAuthUser.user.email,
          recipientName: "Student",
          sessionTitle: title,
          scheduledDate,
          startTime,
          durationMinutes,
          jitsiRoomUrl: `https://meet.jit.si/${cleanRoomName}`,
          partnerName: "Peer Exchange Partner",
        });
      }
    }

    return { success: true, sessionId: session.id, emailSent: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to schedule session." };
  }
}

export async function fetchSessionDetails(
  sessionId: string,
  currentUserId: string
): Promise<{ session: LearningSessionItem; exchange: any; peerUser: any } | null> {
  try {
    const supabase = createClient();

    const { data: session } = await (supabase as any)
      .from("sessions")
      .select("*, exchange:exchanges(*, user_one:profiles!exchanges_user_one_id_fkey(*), user_two:profiles!exchanges_user_two_id_fkey(*), teaching_skill:skills!exchanges_teaching_skill_id_fkey(*), learning_skill:skills!exchanges_learning_skill_id_fkey(*)), topic:learning_topics(*)")
      .eq("id", sessionId)
      .single();

    if (!session || !session.exchange) return null;

    const exch = session.exchange;
    if (exch.user_one_id !== currentUserId && exch.user_two_id !== currentUserId) {
      return null; // Security check
    }

    const peerUser = exch.user_one_id === currentUserId ? exch.user_two : exch.user_one;

    return {
      session,
      exchange: exch,
      peerUser,
    };
  } catch (err) {
    console.error("fetchSessionDetails error:", err);
    return null;
  }
}

export async function updateSessionNotes(
  sessionId: string,
  currentUserId: string,
  notes: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

    const { error } = await (supabase as any)
      .from("sessions")
      .update({
        notes: notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to save session notes." };
  }
}

export async function markSessionComplete(
  sessionId: string,
  currentUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

    const { error } = await (supabase as any)
      .from("sessions")
      .update({
        status: "COMPLETED",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to complete session." };
  }
}

export async function confirmExchangeCompletion(
  exchangeId: string,
  currentUserId: string,
  userRole: "user_one" | "user_two"
): Promise<{ success: boolean; isFullyCompleted?: boolean; error?: string }> {
  try {
    const supabase = createClient();

    const { data: exchange } = await (supabase as any)
      .from("exchanges")
      .select("*")
      .eq("id", exchangeId)
      .single();

    if (!exchange) return { success: false, error: "Exchange not found." };

    const isUserOne = userRole === "user_one";
    const oneConfirmed = isUserOne ? true : Boolean(exchange.user_one_confirmed_completed);
    const twoConfirmed = !isUserOne ? true : Boolean(exchange.user_two_confirmed_completed);

    const isFullyCompleted = oneConfirmed && twoConfirmed;

    const updatePayload: any = {
      user_one_confirmed_completed: oneConfirmed,
      user_two_confirmed_completed: twoConfirmed,
      updated_at: new Date().toISOString(),
    };

    if (isFullyCompleted) {
      updatePayload.status = "completed";
      updatePayload.completed_at = new Date().toISOString();
    }

    const { error } = await (supabase as any)
      .from("exchanges")
      .update(updatePayload)
      .eq("id", exchangeId);

    if (error) return { success: false, error: error.message };

    // Send notification if partner confirmation is needed
    if (!isFullyCompleted) {
      const peerId = isUserOne ? exchange.user_two_id : exchange.user_one_id;
      const { data: actorProfile } = await (supabase as any)
        .from("profiles")
        .select("full_name")
        .eq("id", currentUserId)
        .single();

      const actorName = actorProfile?.full_name || "Your partner";

      await (supabase as any).from("notifications").insert({
        user_id: peerId,
        type: "exchange_completed",
        title: "Exchange Completion Confirmation",
        message: `${actorName} has requested to mark your skill exchange as completed. Please confirm to finalize!`,
        reference_id: exchangeId,
        reference_type: "exchange",
        is_read: false,
      });
    }

    return { success: true, isFullyCompleted };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to confirm exchange completion." };
  }
}
