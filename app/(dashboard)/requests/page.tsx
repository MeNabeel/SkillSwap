"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SkillBadge } from "@/components/skills/SkillBadge";
import {
  fetchUserRequests,
  acceptExchangeRequest,
  rejectExchangeRequest,
  cancelExchangeRequest,
  ExchangeRequestItem,
} from "@/lib/requests/queries";
import { getInitials } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  Send,
  Inbox,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  MessageSquare,
  Sparkles,
  BookOpen,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export default function RequestsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [requestsData, setRequestsData] = useState<{
    incoming: ExchangeRequestItem[];
    sent: ExchangeRequestItem[];
    accepted: ExchangeRequestItem[];
    rejected: ExchangeRequestItem[];
    cancelled: ExchangeRequestItem[];
  }>({
    incoming: [],
    sent: [],
    accepted: [],
    rejected: [],
    cancelled: [],
  });

  const loadRequests = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setCurrentUserId(user.id);
        const res = await fetchUserRequests(user.id);
        setRequestsData(res);
      }
    } catch (err) {
      console.error("Requests load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleAccept = async (requestId: string) => {
    if (!currentUserId) return;
    setActionLoadingId(requestId);
    const res = await acceptExchangeRequest(requestId, currentUserId);
    setActionLoadingId(null);

    if (res.success) {
      toast.success("Skill exchange accepted! Active exchange and conversation initialized.");
      await loadRequests();
      if (res.exchangeId) {
        router.push(`/exchanges/${res.exchangeId}`);
      }
    } else {
      toast.error(res.error || "Failed to accept request.");
    }
  };

  const handleReject = async (requestId: string) => {
    if (!currentUserId) return;
    setActionLoadingId(requestId);
    const res = await rejectExchangeRequest(requestId, currentUserId);
    setActionLoadingId(null);

    if (res.success) {
      toast.info("Request declined.");
      await loadRequests();
    } else {
      toast.error(res.error || "Failed to decline request.");
    }
  };

  const handleCancel = async (requestId: string) => {
    if (!currentUserId) return;
    setActionLoadingId(requestId);
    const res = await cancelExchangeRequest(requestId, currentUserId);
    setActionLoadingId(null);

    if (res.success) {
      toast.info("Request cancelled.");
      await loadRequests();
    } else {
      toast.error(res.error || "Failed to cancel request.");
    }
  };

  const renderRequestCard = (item: ExchangeRequestItem, type: "incoming" | "sent" | "accepted" | "rejected" | "cancelled") => {
    const isIncoming = type === "incoming" || (item.receiver_id === currentUserId && item.status !== "pending");
    const otherUser = isIncoming ? item.sender : item.receiver;
    const otherName = otherUser?.full_name || "Student Peer";
    const otherUsername = otherUser?.username || "student";

    return (
      <Card key={item.id} className="border-border shadow-xs card-hover">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11 border border-border shrink-0">
                <AvatarImage src={otherUser?.avatar_url || ""} alt={otherName} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                  {getInitials(otherName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-base">
                  <Link href={`/students/${otherUser?.id}`} className="hover:text-primary transition-colors">
                    {otherName}
                  </Link>
                </CardTitle>
                <CardDescription className="text-xs">@{otherUsername} • {otherUser?.university || "University N/A"}</CardDescription>
              </div>
            </div>

            <Badge
              variant={
                item.status === "accepted"
                  ? "teaching"
                  : item.status === "pending"
                  ? "secondary"
                  : "outline"
              }
              className="text-[11px] font-semibold capitalize"
            >
              {item.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 text-xs">
          {/* Swapped Skills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-muted/40 p-2.5 rounded-xl border border-border/50">
            <div>
              <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block mb-1">
                Requested Skill:
              </span>
              <SkillBadge
                name={item.requested_skill?.name || "Skill"}
                category={item.requested_skill?.category}
                level="Standard"
                type="learning"
              />
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                Offered Skill:
              </span>
              <SkillBadge
                name={item.offered_skill?.name || "Skill"}
                category={item.offered_skill?.category}
                level="Standard"
                type="teaching"
              />
            </div>
          </div>

          {/* Optional Message */}
          {item.message && (
            <p className="text-xs text-muted-foreground italic bg-card p-2.5 rounded-lg border border-border/60">
              "{item.message}"
            </p>
          )}

          <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1">
            <span>Sent {new Date(item.created_at).toLocaleDateString()}</span>
          </div>
        </CardContent>

        <CardFooter className="pt-2 border-t border-border flex items-center justify-end gap-2">
          {type === "incoming" && item.status === "pending" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleReject(item.id)}
                disabled={actionLoadingId === item.id}
                className="text-xs text-destructive hover:bg-destructive/10"
              >
                Reject
              </Button>
              <Button
                variant="emerald"
                size="sm"
                onClick={() => handleAccept(item.id)}
                disabled={actionLoadingId === item.id}
                className="text-xs font-semibold"
              >
                {actionLoadingId === item.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                )}
                Accept Request
              </Button>
            </>
          )}

          {type === "sent" && item.status === "pending" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCancel(item.id)}
              disabled={actionLoadingId === item.id}
              className="text-xs text-muted-foreground"
            >
              Cancel Request
            </Button>
          )}

          {item.status === "accepted" && (
            <div className="flex items-center gap-2 w-full justify-end">
              <Button asChild size="sm" className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs border-none">
                <Link href={`/exchanges/${(item as any).exchange_id || item.id}`}>
                  <BookOpen className="h-3.5 w-3.5 mr-1" /> Open Workspace
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="text-xs">
                <Link href="/messages">
                  <MessageSquare className="h-3.5 w-3.5 mr-1 text-primary" /> Message Partner
                </Link>
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans animate-in fade-in-50 duration-300">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          Skill Exchange Requests
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Manage incoming requests from peers and review requests you have sent.
        </p>
      </div>

      <Tabs defaultValue="incoming" className="w-full">
        <TabsList className="grid grid-cols-5 w-full max-w-xl h-10 text-xs">
          <TabsTrigger value="incoming" className="text-xs font-semibold">
            Incoming ({requestsData.incoming.length})
          </TabsTrigger>
          <TabsTrigger value="sent" className="text-xs font-semibold">
            Sent ({requestsData.sent.length})
          </TabsTrigger>
          <TabsTrigger value="accepted" className="text-xs font-semibold">
            Accepted ({requestsData.accepted.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="text-xs font-semibold">
            Rejected ({requestsData.rejected.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="text-xs font-semibold">
            Cancelled ({requestsData.cancelled.length})
          </TabsTrigger>
        </TabsList>

        <div className="pt-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <Card key={i} className="p-4 space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-16 w-full" />
                </Card>
              ))}
            </div>
          ) : (
            <>
              <TabsContent value="incoming" className="space-y-4 m-0">
                {requestsData.incoming.length === 0 ? (
                  <Card className="p-10 text-center border-dashed border-border">
                    <Inbox className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <h3 className="text-sm font-semibold">No incoming requests</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      When students request to learn from your teaching skills, their requests will appear here.
                    </p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {requestsData.incoming.map((item) => renderRequestCard(item, "incoming"))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="sent" className="space-y-4 m-0">
                {requestsData.sent.length === 0 ? (
                  <Card className="p-10 text-center border-dashed border-border">
                    <Send className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <h3 className="text-sm font-semibold">No pending sent requests</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Browse Discover to find student mentors and send your first request!
                    </p>
                    <Button asChild size="sm" className="mt-3 text-xs">
                      <Link href="/discover">Discover Students</Link>
                    </Button>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {requestsData.sent.map((item) => renderRequestCard(item, "sent"))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="accepted" className="space-y-4 m-0">
                {requestsData.accepted.length === 0 ? (
                  <Card className="p-10 text-center border-dashed border-border">
                    <CheckCircle2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <h3 className="text-sm font-semibold">No accepted requests yet</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Accepted requests will automatically create active exchanges and chat conversations.
                    </p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {requestsData.accepted.map((item) => renderRequestCard(item, "accepted"))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="rejected" className="space-y-4 m-0">
                {requestsData.rejected.length === 0 ? (
                  <Card className="p-10 text-center border-dashed border-border">
                    <p className="text-xs text-muted-foreground">No rejected requests.</p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {requestsData.rejected.map((item) => renderRequestCard(item, "rejected"))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="cancelled" className="space-y-4 m-0">
                {requestsData.cancelled.length === 0 ? (
                  <Card className="p-10 text-center border-dashed border-border">
                    <p className="text-xs text-muted-foreground">No cancelled requests.</p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {requestsData.cancelled.map((item) => renderRequestCard(item, "cancelled"))}
                  </div>
                )}
              </TabsContent>
            </>
          )}
        </div>
      </Tabs>
    </div>
  );
}
