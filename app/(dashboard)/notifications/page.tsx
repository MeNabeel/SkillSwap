"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  NotificationItem,
} from "@/lib/notifications/queries";
import { createClient } from "@/lib/supabase/client";
import {
  Bell,
  CheckCheck,
  Inbox,
  CheckCircle2,
  MessageSquare,
  Star,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const loadNotifications = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setCurrentUserId(user.id);
        const list = await fetchUserNotifications(user.id);
        setNotifications(list);
      }
    } catch (err) {
      console.error("Notifications load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkRead = async (id: string) => {
    if (!currentUserId) return;
    await markNotificationAsRead(id, currentUserId);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const handleMarkAllRead = async () => {
    if (!currentUserId) return;
    await markAllNotificationsAsRead(currentUserId);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    toast.success("All notifications marked as read.");
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "exchange_request":
        return <Inbox className="h-4 w-4 text-indigo-600" />;
      case "request_accepted":
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case "new_message":
        return <MessageSquare className="h-4 w-4 text-primary" />;
      case "rating_received":
        return <Star className="h-4 w-4 text-amber-500 fill-amber-500" />;
      default:
        return <Bell className="h-4 w-4 text-violet-600" />;
    }
  };

  const getNotificationLink = (n: NotificationItem) => {
    if (n.type === "exchange_request") return "/requests";
    if (n.type === "new_message") return "/messages";
    if (n.type === "request_accepted" || n.type === "exchange_completed") {
      return n.reference_id ? `/exchanges/${n.reference_id}` : "/exchanges";
    }
    return "/notifications";
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans animate-in fade-in-50 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            Notifications {unreadCount > 0 && <Badge variant="destructive" className="text-xs">{unreadCount} new</Badge>}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Updates on exchange requests, messages, and peer reviews.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            className="text-xs shrink-0"
          >
            <CheckCheck className="h-3.5 w-3.5 mr-1.5" /> Mark All as Read
          </Button>
        )}
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="p-0 divide-y divide-border/60">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-xl" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
              <Bell className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <p className="font-semibold text-foreground">You're all caught up!</p>
              <p>No notifications yet.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 flex items-start justify-between gap-4 transition-colors hover:bg-muted/30 ${
                  !n.is_read ? "bg-primary/5 font-medium" : ""
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-card border border-border flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    {getNotificationIcon(n.type)}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-foreground truncate">
                        {n.title}
                      </h4>
                      {!n.is_read && (
                        <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {n.message}
                    </p>
                    <span className="text-[10px] text-muted-foreground/80 block">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!n.is_read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkRead(n.id)}
                      className="h-8 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Mark Read
                    </Button>
                  )}

                  <Button asChild size="sm" variant="outline" className="h-8 text-xs">
                    <Link href={getNotificationLink(n)}>
                      View <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
