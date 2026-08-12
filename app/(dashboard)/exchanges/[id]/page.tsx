"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SkillBadge } from "@/components/skills/SkillBadge";
import { RatingModal } from "@/components/ratings/RatingModal";
import { fetchExchangeById, completeExchange, ExchangeItem } from "@/lib/exchanges/queries";
import { getInitials } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  MessageSquare,
  CheckCircle2,
  Star,
  Repeat,
  Calendar,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export default function ExchangeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [exchange, setExchange] = useState<ExchangeItem | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [completing, setCompleting] = useState(false);

  const loadData = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user && id) {
        setCurrentUserId(user.id);
        const data = await fetchExchangeById(id, user.id);
        setExchange(data);
      }
    } catch (err) {
      console.error("Exchange detail load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleComplete = async () => {
    if (!currentUserId || !exchange) return;
    setCompleting(true);
    const res = await completeExchange(exchange.id, currentUserId);
    setCompleting(false);

    if (res.success) {
      toast.success("Skill exchange completed! You can now submit a rating.");
      await loadData();
    } else {
      toast.error(res.error || "Failed to complete exchange.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-8">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (!exchange) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4 font-sans">
        <h2 className="text-xl font-bold text-foreground">Exchange Not Found</h2>
        <p className="text-xs text-muted-foreground">
          This exchange does not exist or you do not have permission to view it.
        </p>
        <Button asChild size="sm">
          <Link href="/exchanges">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Exchanges
          </Link>
        </Button>
      </div>
    );
  }

  const peerName = exchange.peerUser?.full_name || "Student Peer";
  const peerUsername = exchange.peerUser?.username || "student";

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans animate-in fade-in-50 duration-300">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="text-xs">
          <Link href="/exchanges">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Exchanges
          </Link>
        </Button>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-14 w-14 border border-border">
                <AvatarImage src={exchange.peerUser?.avatar_url || ""} alt={peerName} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-base">
                  {getInitials(peerName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl">
                  Exchange with {peerName}
                </CardTitle>
                <CardDescription className="text-xs">
                  @{peerUsername} • {exchange.peerUser?.university || "University N/A"}
                </CardDescription>
              </div>
            </div>

            <Badge
              variant={exchange.status === "active" ? "teaching" : "outline"}
              className="text-xs font-semibold capitalize px-3 py-1"
            >
              {exchange.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Skill Swap Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/40 p-4 rounded-xl border border-border/50">
            <div className="space-y-2">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                Teaching Skill:
              </span>
              <SkillBadge
                name={exchange.teaching_skill?.name || "Skill"}
                category={exchange.teaching_skill?.category}
                level="Standard"
                type="teaching"
              />
            </div>
            <div className="space-y-2">
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block">
                Learning Skill:
              </span>
              <SkillBadge
                name={exchange.learning_skill?.name || "Skill"}
                category={exchange.learning_skill?.category}
                level="Standard"
                type="learning"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-primary" />
              <span>Started: {new Date(exchange.started_at).toLocaleDateString()}</span>
            </div>

            {exchange.completed_at && (
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Completed: {new Date(exchange.completed_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-4">
            <Button asChild size="sm" variant="default" className="font-semibold shadow-xs">
              <Link href="/messages">
                <MessageSquare className="h-4 w-4 mr-2" /> Open Realtime Chat
              </Link>
            </Button>

            {exchange.status === "active" && (
              <Button
                variant="emerald"
                size="sm"
                onClick={handleComplete}
                disabled={completing}
                className="font-semibold"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Exchange Complete
              </Button>
            )}

            {exchange.status === "completed" && (
              exchange.hasRated ? (
                <Badge variant="outline" className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-3 py-1">
                  <Star className="h-3.5 w-3.5 mr-1 fill-amber-500 text-amber-500" /> Rating Submitted
                </Badge>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRatingModalOpen(true)}
                  className="text-amber-600 border-amber-500/30 hover:bg-amber-50"
                >
                  <Star className="h-4 w-4 mr-2 fill-amber-500 text-amber-500" /> Rate Partner
                </Button>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rating Dialog Modal */}
      {exchange.peerUser && (
        <RatingModal
          open={ratingModalOpen}
          onOpenChange={setRatingModalOpen}
          exchangeId={exchange.id}
          reviewerId={currentUserId || ""}
          reviewedUser={exchange.peerUser}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}
