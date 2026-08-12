import { createClient } from "@/lib/supabase/client";

export interface NotificationItem {
  id: string;
  user_id: string;
  type: "exchange_request" | "request_accepted" | "request_rejected" | "new_message" | "exchange_completed" | "rating_received" | "new_match";
  title: string;
  message: string;
  reference_id: string | null;
  reference_type: string | null;
  is_read: boolean;
  created_at: string;
}

export async function fetchUserNotifications(userId: string): Promise<NotificationItem[]> {
  try {
    const supabase = createClient();
    const { data, error } = await (supabase as any)
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data;
  } catch (err) {
    console.error("fetchUserNotifications error:", err);
    return [];
  }
}

export async function markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
  try {
    const supabase = createClient();
    await (supabase as any)
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
      .eq("user_id", userId);
  } catch (err) {
    console.error("markNotificationAsRead error:", err);
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    const supabase = createClient();
    await (supabase as any)
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
  } catch (err) {
    console.error("markAllNotificationsAsRead error:", err);
  }
}

export function subscribeToUserNotifications(
  userId: string,
  onNotification: (notif: NotificationItem) => void
) {
  const supabase = createClient();
  const channel = supabase
    .channel(`notifs_${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onNotification(payload.new as NotificationItem);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
