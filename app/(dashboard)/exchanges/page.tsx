"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SkillBadge } from "@/components/skills/SkillBadge";
import { RatingModal } from "@/components/ratings/RatingModal";
import {
  fetchUserExchanges,
  completeExchange,
  ExchangeItem,
} from "@/lib/exchanges/queries";
import { getInitials } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  Repeat,
  CheckCircle2,
  MessageSquare,
  Star,
  Clock,
  ArrowRight,
  BookOpen,
  Loader2,
  Compass,
} from "lucide-react";
import { toast } from "sonner";

export default function ExchangesPage() {
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [exchangesData, setExchangesData] = useState<{
    active: ExchangeItem[];
    completed: ExchangeItem[];
    cancelled: ExchangeItem[];
  }>({
    active: [],
    completed: [],
    cancelled: [],
  });

  const [ratingTarget, setRatingTarget] = useState<{
    exchangeId: string;
    reviewedUser: any;
  } | null>(null);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadExchanges = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setCurrentUserId(user.id);
        const res = await fetchUserExchanges(user.id);
        setExchangesData(res);
      }
    } catch (err) {
      console.error("Exchanges load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExchanges();
  }, []);

  const handleComplete = async (exchangeId: string) => {
    if (!currentUserId) return;
    setActionLoadingId(exchangeId);
    const res = await completeExchange(exchangeId, currentUserId);
    setActionLoadingId(null);

    if (res.success) {
      toast.success("Skill exchange completed! You can now rate your experience.");
      await loadExchanges();
    } else {
      toast.error(res.error || "Failed to complete exchange.");
    }
  };

  const openRatingDialog = (exchange: ExchangeItem) => {
    setRatingTarget({
      exchangeId: exchange.id,
      reviewedUser: exchange.peerUser,
    });
    setRatingModalOpen(true);
  };

  const renderExchangeCard = (item: ExchangeItem, statusType: "active" | "completed" | "cancelled") => {
    const peerName = item.peerUser?.full_name || "Student Peer";
    const peerUsername = item.peerUser?.username || "student";

    return (
      <Card key={item.id} className="border-border shadow-xs card-hover flex flex-col justify-between">
        <div>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11 border border-border shrink-0">
                  <AvatarImage src={item.peerUser?.avatar_url || ""} alt={peerName} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                    {getInitials(peerName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base">
                    <Link href={`/students/${item.peerUser?.id}`} className="hover:text-primary transition-colors">
                      {peerName}
                    </Link>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    @{peerUsername} • {item.peerUser?.university || "University N/A"}
                  </CardDescription>
                </div>
              </div>

              <Badge
                variant={statusType === "active" ? "teaching" : "outline"}
                className="text-[11px] font-semibold capitalize"
              >
                {statusType}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-muted/40 p-2.5 rounded-xl border border-border/50">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                  Teaching Skill:
                </span>
                <SkillBadge
                  name={item.teaching_skill?.name || "Skill"}
                  category={item.teaching_skill?.category}
                  level="Standard"
                  type="teaching"
                />
              </div>
              <div>
                <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block mb-1">
                  Learning Skill:
                </span>
                <SkillBadge
                  name={item.learning_skill?.name || "Skill"}
                  category={item.learning_skill?.category}
                  level="Standard"
                  type="learning"
                />
              </div>
            </div>

            <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1">
              <span>Started {new Date(item.started_at).toLocaleDateString()}</span>
              {item.completed_at && <span>Completed {new Date(item.completed_at).toLocaleDateString()}</span>}
            </div>
          </CardContent>
        </div>

        <CardFooter className="pt-3 border-t border-border flex items-center justify-between gap-2">
          {statusType === "active" && (
            <div className="flex items-center gap-2 w-full">
              <Button asChild size="sm" className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold flex-1 shadow-xs border-none">
                <Link href={`/exchanges/${item.id}`}>
                  <BookOpen className="h-3.5 w-3.5 mr-1" /> Open Workspace
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="text-xs flex-1">
                <Link href="/messages">
                  <MessageSquare className="h-3.5 w-3.5 mr-1 text-primary" /> Open Chat
                </Link>
              </Button>
            </div>
          )}

          {statusType === "completed" && (
            <div className="flex items-center justify-between w-full">
              <Button asChild size="sm" variant="ghost" className="text-xs">
                <Link href={`/exchanges/${item.id}`}>
                  Workspace Archive <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              </Button>

              {item.hasRated ? (
                <Badge variant="outline" className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/40">
                  <Star className="h-3 w-3 mr-1 fill-amber-500 text-amber-500" /> Rated
                </Badge>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openRatingDialog(item)}
                  className="text-xs text-amber-600 border-amber-500/30 hover:bg-amber-50"
                >
                  <Star className="h-3.5 w-3.5 mr-1 fill-amber-500 text-amber-500" /> Rate Partner
                </Button>
              )}
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
          Active & Completed Skill Exchanges
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Access your interactive Exchange Workspaces, manage learning plans, schedule video calls, and complete sessions.
        </p>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md h-10 text-xs">
          <TabsTrigger value="active" className="text-xs font-semibold">
            Active ({exchangesData.active.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="text-xs font-semibold">
            Completed ({exchangesData.completed.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="text-xs font-semibold">
            Cancelled ({exchangesData.cancelled.length})
          </TabsTrigger>
        </TabsList>

        <div className="pt-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <Card key={i} className="p-4 space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-20 w-full" />
                </Card>
              ))}
            </div>
          ) : (
            <>
              <TabsContent value="active" className="space-y-4 m-0">
                {exchangesData.active.length === 0 ? (
                  <Card className="p-10 text-center border-dashed border-border">
                    <Repeat className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <h3 className="text-sm font-semibold">No active exchanges</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Once a skill exchange request is accepted, your active workspace will appear here.
                    </p>
                    <Button asChild size="sm" className="mt-3 text-xs">
                      <Link href="/requests">View Exchange Requests</Link>
                    </Button>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {exchangesData.active.map((item) => renderExchangeCard(item, "active"))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="completed" className="space-y-4 m-0">
                {exchangesData.completed.length === 0 ? (
                  <Card className="p-10 text-center border-dashed border-border">
                    <CheckCircle2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <h3 className="text-sm font-semibold">No completed exchanges yet</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Mark your active exchanges complete to earn reviews and build peer reputation.
                    </p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {exchangesData.completed.map((item) => renderExchangeCard(item, "completed"))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="cancelled" className="space-y-4 m-0">
                {exchangesData.cancelled.length === 0 ? (
                  <Card className="p-10 text-center border-dashed border-border">
                    <p className="text-xs text-muted-foreground">No cancelled exchanges.</p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {exchangesData.cancelled.map((item) => renderExchangeCard(item, "cancelled"))}
                  </div>
                )}
              </TabsContent>
            </>
          )}
        </div>
      </Tabs>

      {/* Rating Dialog Modal */}
      {ratingTarget && (
        <RatingModal
          open={ratingModalOpen}
          onOpenChange={setRatingModalOpen}
          exchangeId={ratingTarget.exchangeId}
          reviewerId={currentUserId || ""}
          reviewedUser={ratingTarget.reviewedUser}
          onSuccess={loadExchanges}
        />
      )}
    </div>
  );
}
