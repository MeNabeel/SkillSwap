import { createClient } from "@/lib/supabase/client";

export interface ConversationItem {
  id: string;
  exchange_id: string;
  created_at: string;
  updated_at: string;
  peerUser: any;
  lastMessage?: string | null;
  lastMessageTime?: string | null;
  unreadCount: number;
  exchange?: any;
}

export interface MessageItem {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
  sender?: any;
}

export async function fetchUserConversations(userId: string): Promise<ConversationItem[]> {
  try {
    const supabase = createClient();

    // Fetch conversation memberships for user
    const { data: memberships, error } = await (supabase as any)
      .from("conversation_members")
      .select("conversation_id, joined_at, conversation:conversations(*, exchange:exchanges(*, user_one:profiles!exchanges_user_one_id_fkey(*), user_two:profiles!exchanges_user_two_id_fkey(*), teaching_skill:skills!exchanges_teaching_skill_id_fkey(*), learning_skill:skills!exchanges_learning_skill_id_fkey(*)))")
      .eq("user_id", userId);

    if (error || !memberships) return [];

    const conversationPromises = memberships.map(async (m: any) => {
      const conv = m.conversation;
      if (!conv) return null;

      const exchange = conv.exchange;
      const peerUser = exchange?.user_one_id === userId ? exchange?.user_two : exchange?.user_one;

      // Fetch last message for conversation
      const { data: lastMsgs } = await (supabase as any)
        .from("messages")
        .select("content, created_at, read_at, sender_id")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: false })
        .limit(1);

      const lastMsg = lastMsgs && lastMsgs.length > 0 ? lastMsgs[0] : null;

      // Count unread messages
      const { count: unreadCount } = await (supabase as any)
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("conversation_id", conv.id)
        .neq("sender_id", userId)
        .is("read_at", null);

      return {
        id: conv.id,
        exchange_id: conv.exchange_id,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        peerUser,
        exchange,
        lastMessage: lastMsg?.content || "No messages yet",
        lastMessageTime: lastMsg?.created_at || conv.created_at,
        unreadCount: unreadCount || 0,
      } as ConversationItem;
    });

    const results = await Promise.all(conversationPromises);
    const valid = results.filter(Boolean) as ConversationItem[];

    // Sort by last message time
    valid.sort((a, b) => new Date(b.lastMessageTime || b.created_at).getTime() - new Date(a.lastMessageTime || a.created_at).getTime());

    return valid;
  } catch (err) {
    console.error("fetchUserConversations error:", err);
    return [];
  }
}

export async function fetchConversationMessages(
  conversationId: string,
  userId: string
): Promise<MessageItem[]> {
  try {
    const supabase = createClient();

    // Verify member
    const { data: member } = await (supabase as any)
      .from("conversation_members")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("user_id", userId)
      .single();

    if (!member) return [];

    const { data: messages, error } = await (supabase as any)
      .from("messages")
      .select("*, sender:profiles(id, full_name, avatar_url, username)")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error || !messages) return [];
    return messages;
  } catch (err) {
    console.error("fetchConversationMessages error:", err);
    return [];
  }
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string
): Promise<{ success: boolean; message?: MessageItem; error?: string }> {
  if (!content.trim()) {
    return { success: false, error: "Message content cannot be empty." };
  }

  try {
    const supabase = createClient();

    const { data: message, error } = await (supabase as any)
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content: content.trim(),
      })
      .select("*, sender:profiles(id, full_name, avatar_url, username)")
      .single();

    if (error) throw error;

    // Get peer user in conversation to create unread message notification
    const { data: members } = await (supabase as any)
      .from("conversation_members")
      .select("user_id")
      .eq("conversation_id", conversationId)
      .neq("user_id", senderId);

    if (members && members.length > 0) {
      const peerId = members[0].user_id;
      const senderName = message.sender?.full_name || "Peer";

      await (supabase as any).from("notifications").insert({
        user_id: peerId,
        type: "new_message",
        title: "New Message",
        message: `${senderName}: ${content.trim().slice(0, 50)}...`,
        reference_id: conversationId,
        reference_type: "conversation",
        is_read: false,
      });
    }

    return { success: true, message };
  } catch (err: any) {
    console.error("sendMessage error:", err);
    return { success: false, error: err.message || "Failed to send message." };
  }
}

export async function markMessagesAsRead(conversationId: string, currentUserId: string): Promise<void> {
  try {
    const supabase = createClient();
    await (supabase as any)
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .neq("sender_id", currentUserId)
      .is("read_at", null);
  } catch (err) {
    console.error("markMessagesAsRead error:", err);
  }
}

export function subscribeToConversation(
  conversationId: string,
  onNewMessage: (msg: MessageItem) => void
) {
  const supabase = createClient();
  const channel = supabase
    .channel(`chat_${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        onNewMessage(payload.new as MessageItem);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
