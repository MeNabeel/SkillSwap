"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SkillBadge } from "@/components/skills/SkillBadge";
import {
  fetchSessionDetails,
  updateSessionNotes,
  markSessionComplete,
  LearningSessionItem,
} from "@/lib/workspace/queries";
import { getInitials } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Video,
  CheckCircle2,
  FileText,
  Save,
  MessageSquare,
  Sparkles,
  Users,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();

  const exchangeId = params?.id as string;
  const sessionId = params?.sessionId as string;

  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<{
    session: LearningSessionItem;
    exchange: any;
    peerUser: any;
  } | null>(null);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [videoActive, setVideoActive] = useState(false);
  const [notesText, setNotesText] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [completing, setCompleting] = useState(false);

  const loadData = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user && sessionId) {
        setCurrentUserId(user.id);
        const res = await fetchSessionDetails(sessionId, user.id);
        if (res) {
          setSessionData(res);
          setNotesText(res.session.notes || "");
        }
      }
    } catch (err) {
      console.error("Session detail load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-8">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4 font-sans">
        <h2 className="text-xl font-bold text-foreground">Session Not Found</h2>
        <p className="text-xs text-muted-foreground">
          This learning session does not exist or you do not have permission to view it.
        </p>
        <Button asChild size="sm">
          <Link href={`/exchanges/${exchangeId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Workspace
          </Link>
        </Button>
      </div>
    );
  }

  const { session, exchange, peerUser } = sessionData;
  const peerName = peerUser?.full_name || "Partner Student";
  const peerUsername = peerUser?.username || "student";

  const handleSaveNotes = async () => {
    if (!currentUserId) return;
    setSavingNotes(true);
    const res = await updateSessionNotes(session.id, currentUserId, notesText);
    setSavingNotes(false);

    if (res.success) {
      toast.success("Session notes saved to Supabase!");
      await loadData();
    } else {
      toast.error(res.error || "Failed to save notes.");
    }
  };

  const handleCompleteSession = async () => {
    if (!currentUserId) return;
    setCompleting(true);
    const res = await markSessionComplete(session.id, currentUserId);
    setCompleting(false);

    if (res.success) {
      toast.success("Session marked as complete!");
      await loadData();
    } else {
      toast.error(res.error || "Failed to mark session complete.");
    }
  };

  const jitsiRoomUrl = `https://meet.jit.si/${session.jitsi_room_name}#config.prejoinPageEnabled=false&config.startWithAudioMuted=true`;

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans animate-in fade-in-50 duration-300 pb-12">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="text-xs">
          <Link href={`/exchanges/${exchangeId}`}>
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Workspace
          </Link>
        </Button>

        <Badge
          variant={session.status === "COMPLETED" ? "teaching" : "secondary"}
          className="text-xs font-semibold capitalize px-3 py-1"
        >
          ● {session.status}
        </Badge>
      </div>

      {/* Session Title & Metadata Card */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
                <Video className="h-3.5 w-3.5" /> 1-to-1 Learning Meeting
              </div>
              <CardTitle className="text-2xl font-bold text-foreground pt-1">
                {session.title}
              </CardTitle>
              <CardDescription className="text-xs flex flex-wrap items-center gap-4 pt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-primary" /> {new Date(session.scheduled_date).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-primary" /> {session.start_time} ({session.duration_minutes} mins)
                </span>
              </CardDescription>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {session.status !== "COMPLETED" && (
                <Button
                  variant="emerald"
                  size="sm"
                  onClick={handleCompleteSession}
                  disabled={completing}
                  className="font-semibold text-xs"
                >
                  {completing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />}
                  Mark Complete
                </Button>
              )}
              <Button asChild variant="outline" size="sm" className="text-xs">
                <Link href="/messages">
                  <MessageSquare className="h-3.5 w-3.5 mr-1.5 text-primary" /> Chat
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          {/* Participants Row */}
          <div className="flex items-center gap-3 bg-muted/40 p-3 rounded-xl border border-border/60">
            <Users className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs font-semibold text-foreground">Participants:</span>
            <div className="flex items-center gap-2 text-xs">
              <Avatar className="h-6 w-6 border border-border">
                <AvatarImage src={peerUser?.avatar_url || ""} alt={peerName} />
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                  {getInitials(peerName)}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium text-foreground">{peerName}</span>
              <span className="text-muted-foreground">(@{peerUsername})</span>
            </div>
          </div>

          {/* Related Topic Badge */}
          {session.topic && (
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <span className="font-semibold text-foreground">Related Topic:</span>
              <Badge variant="outline" className="text-xs font-medium">
                {session.topic.title}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interactive Jitsi Meet 1-to-1 Video Call Section */}
      <Card className="border-border shadow-md overflow-hidden bg-card">
        <CardHeader className="bg-slate-900 text-white p-4 sm:p-5 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Video className="h-5 w-5 text-emerald-400" />
            <CardTitle className="text-base text-white font-bold">
              Video Call Room
            </CardTitle>
          </div>

          <Button
            size="sm"
            className={videoActive ? "bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs" : "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"}
            onClick={() => setVideoActive(!videoActive)}
          >
            <Video className="h-3.5 w-3.5 mr-1.5" />
            {videoActive ? "Leave Call" : "Join Video Call"}
          </Button>
        </CardHeader>

        <CardContent className="p-0 bg-slate-950 min-h-[420px] flex items-center justify-center">
          {videoActive ? (
            <iframe
              src={jitsiRoomUrl}
              allow="camera; microphone; display-capture; autoplay; clipboard-write"
              className="w-full h-[520px] border-none"
              title="SkillSwap 1-to-1 Video Call"
            />
          ) : (
            <div className="text-center p-8 sm:p-12 space-y-4">
              <div className="h-16 w-16 rounded-full bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                <Video className="h-8 w-8" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="text-base font-bold text-white">Ready for your 1-to-1 session?</h3>
                <p className="text-xs text-slate-400">
                  Click "Join Video Call" to launch your secure video room with {peerName}.
                </p>
              </div>

              <div className="pt-2 flex justify-center gap-3">
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
                  onClick={() => setVideoActive(true)}
                >
                  <Video className="h-4 w-4 mr-1.5" /> Join Video Call
                </Button>
                <a
                  href={jitsiRoomUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700"
                >
                  Open in External Window <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shared Session Notes Section */}
      <Card className="border-border shadow-xs bg-card">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2 text-foreground">
              <FileText className="h-4 w-4 text-primary" /> Shared Session Notes
            </CardTitle>
            <CardDescription className="text-xs">
              Collaborative meeting notes saved to your workspace database for both partners.
            </CardDescription>
          </div>

          <Button
            size="sm"
            onClick={handleSaveNotes}
            disabled={savingNotes}
            className="text-xs font-semibold"
          >
            {savingNotes ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
            Save Notes
          </Button>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Record topics covered, code snippets, key takeaways, and action items for next session..."
            value={notesText}
            onChange={(e) => setNotesText(e.target.value)}
            rows={8}
            className="font-mono text-xs leading-relaxed"
          />
        </CardContent>
      </Card>
    </div>
  );
}
