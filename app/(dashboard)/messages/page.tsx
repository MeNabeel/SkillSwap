"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  fetchUserConversations,
  fetchConversationMessages,
  sendMessage,
  markMessagesAsRead,
  subscribeToConversation,
  ConversationItem,
  MessageItem,
} from "@/lib/chat/queries";
import { getInitials } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  Send,
  MessageSquare,
  ArrowLeft,
  Loader2,
  CheckCheck,
  Sparkles,
  Wifi,
} from "lucide-react";
import { toast } from "sonner";

export default function MessagesPage() {
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [inputContent, setInputContent] = useState("");
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load User Conversations
  useEffect(() => {
    async function loadConversations() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          setCurrentUserId(user.id);
          const list = await fetchUserConversations(user.id);
          setConversations(list);

          if (list.length > 0 && !activeConvId) {
            setActiveConvId(list[0].id);
          }
        }
      } catch (err) {
        console.error("Messages load conversations error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadConversations();
  }, []);

  // Load Active Conversation Messages & Subscribe to Realtime Updates
  useEffect(() => {
    if (!activeConvId || !currentUserId) return;

    let unsubscribe: (() => void) | null = null;

    async function loadActiveMessages() {
      setMessagesLoading(true);
      const history = await fetchConversationMessages(activeConvId!, currentUserId!);
      setMessages(history);
      setMessagesLoading(false);
      scrollToBottom();

      // Mark unread messages as read
      await markMessagesAsRead(activeConvId!, currentUserId!);

      // Update local unread count in conversations state
      setConversations((prev) =>
        prev.map((c) => (c.id === activeConvId ? { ...c, unreadCount: 0 } : c))
      );

      // Subscribe to Supabase Realtime WebSocket for this active conversation
      unsubscribe = subscribeToConversation(activeConvId!, (newMsg) => {
        setMessages((prevMsgs) => {
          if (prevMsgs.some((m) => m.id === newMsg.id)) return prevMsgs;
          return [...prevMsgs, newMsg];
        });
        scrollToBottom();

        if (newMsg.sender_id !== currentUserId) {
          markMessagesAsRead(activeConvId!, currentUserId!);
        }
      });
    }

    loadActiveMessages();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [activeConvId, currentUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputContent.trim() || !activeConvId || !currentUserId || sending) return;

    const content = inputContent.trim();
    setInputContent("");
    setSending(true);

    const res = await sendMessage(activeConvId, currentUserId, content);
    setSending(false);

    if (res.success && res.message) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === res.message!.id)) return prev;
        return [...prev, res.message!];
      });
      scrollToBottom();

      // Update last message preview in left list
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConvId
            ? { ...c, lastMessage: content, lastMessageTime: new Date().toISOString() }
            : c
        )
      );
    } else {
      toast.error(res.error || "Failed to send message.");
    }
  };

  const activeConversation = conversations.find((c) => c.id === activeConvId);

  return (
    <div className="space-y-4 max-w-6xl mx-auto font-sans animate-in fade-in-50 duration-300">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          Skill Swap Messages
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Private, real-time chat with your skill exchange partners.
        </p>
      </div>

      <Card className="border-border shadow-sm overflow-hidden h-[calc(100vh-220px)] min-h-[500px] flex">
        {/* Left List Pane: Conversations */}
        <div
          className={`w-full md:w-80 border-r border-border bg-card flex flex-col shrink-0 ${
            activeConvId ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="p-3.5 border-b border-border font-semibold text-xs text-foreground flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" /> Active Chats
            </span>
            <Badge variant="outline" className="text-[10px]">
              {conversations.length} total
            </Badge>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border/60">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-3.5 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
                <MessageSquare className="h-7 w-7 mx-auto text-muted-foreground/60" />
                <p>No active conversations yet.</p>
                <p className="text-[11px]">
                  Accept an exchange request to start chatting!
                </p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = conv.id === activeConvId;
                const peerName = conv.peerUser?.full_name || "Student Peer";

                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    className={`w-full p-3.5 text-left transition-colors flex items-start gap-3 hover:bg-muted/50 ${
                      isSelected ? "bg-primary/5 border-l-4 border-primary" : ""
                    }`}
                  >
                    <Avatar className="h-10 w-10 border border-border shrink-0">
                      <AvatarImage src={conv.peerUser?.avatar_url || ""} alt={peerName} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                        {getInitials(peerName)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-xs text-foreground truncate">
                          {peerName}
                        </span>
                        {conv.unreadCount > 0 && (
                          <Badge variant="destructive" className="h-4 px-1.5 text-[10px]">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>

                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {conv.lastMessage}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Active Chat Conversation Window */}
        <div
          className={`flex-1 flex flex-col bg-background ${
            !activeConvId ? "hidden md:flex" : "flex"
          }`}
        >
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-3.5 border-b border-border bg-card flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveConvId(null)}
                    className="md:hidden h-8 px-2 text-xs"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>

                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarImage src={activeConversation.peerUser?.avatar_url || ""} alt={activeConversation.peerUser?.full_name} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                      {getInitials(activeConversation.peerUser?.full_name || "Student")}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <h3 className="font-bold text-sm text-foreground">
                      <Link href={`/students/${activeConversation.peerUser?.id}`} className="hover:text-primary transition-colors">
                        {activeConversation.peerUser?.full_name}
                      </Link>
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      @{activeConversation.peerUser?.username} • {activeConversation.peerUser?.university || "University N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40">
                    <Wifi className="h-3 w-3 mr-1 text-emerald-500 animate-pulse" /> Realtime Connected
                  </Badge>
                  <Button asChild size="sm" variant="ghost" className="h-8 text-xs">
                    <Link href={`/exchanges/${activeConversation.exchange_id}`}>View Exchange</Link>
                  </Button>
                </div>
              </div>

              {/* Message Stream Body */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-card/30">
                {messagesLoading ? (
                  <div className="space-y-3 py-4">
                    <Skeleton className="h-10 w-2/3 ml-auto rounded-xl" />
                    <Skeleton className="h-10 w-2/3 mr-auto rounded-xl" />
                    <Skeleton className="h-12 w-1/2 ml-auto rounded-xl" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-xs text-muted-foreground space-y-2">
                    <Sparkles className="h-6 w-6 text-primary mx-auto" />
                    <p className="font-semibold text-foreground">Start the conversation!</p>
                    <p className="text-[11px]">
                      Say hello to {activeConversation.peerUser?.full_name?.split(" ")[0]} and coordinate your skill exchange session.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.sender_id === currentUserId;

                    return (
                      <div
                        key={msg.id}
                        className={`flex items-end gap-2 ${
                          isOwn ? "justify-end" : "justify-start"
                        }`}
                      >
                        {!isOwn && (
                          <Avatar className="h-7 w-7 border border-border shrink-0">
                            <AvatarImage src={msg.sender?.avatar_url || activeConversation.peerUser?.avatar_url || ""} alt="Avatar" />
                            <AvatarFallback className="text-[10px]">
                              {getInitials(msg.sender?.full_name || "S")}
                            </AvatarFallback>
                          </Avatar>
                        )}

                        <div
                          className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                            isOwn
                              ? "bg-primary text-primary-foreground rounded-br-none"
                              : "bg-muted text-foreground border border-border/60 rounded-bl-none"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          <div
                            className={`text-[9px] mt-1 flex items-center justify-end gap-1 ${
                              isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                            }`}
                          >
                            <span>
                              {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {isOwn && <CheckCheck className="h-3 w-3" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-border bg-card flex items-center gap-2">
                <Input
                  value={inputContent}
                  onChange={(e) => setInputContent(e.target.value)}
                  placeholder={`Message ${activeConversation.peerUser?.full_name?.split(" ")[0] || "peer"}...`}
                  className="h-10 text-xs border-border bg-background flex-1"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={sending || !inputContent.trim()}
                  className="h-10 px-4 font-semibold shrink-0"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-xs text-muted-foreground space-y-2">
              <MessageSquare className="h-10 w-10 text-muted-foreground/40" />
              <h3 className="font-semibold text-sm text-foreground">No Chat Selected</h3>
              <p>Select a conversation from the left to start messaging your exchange partner.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
