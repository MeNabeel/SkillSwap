"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SkillBadge } from "@/components/skills/SkillBadge";
import { RatingModal } from "@/components/ratings/RatingModal";
import {
  fetchWorkspaceData,
  createManualLearningPlan,
  createLearningTopic,
  toggleTopicStudentCompletion,
  addTopicResource,
  scheduleLearningSession,
  confirmExchangeCompletion,
  WorkspaceData,
  LearningTopicItem,
} from "@/lib/workspace/queries";
import { getInitials } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  MessageSquare,
  CheckCircle2,
  Star,
  Repeat,
  Calendar,
  Sparkles,
  Video,
  Plus,
  BookOpen,
  Link as LinkIcon,
  FileText,
  Github,
  Clock,
  CheckSquare,
  Square,
  Loader2,
  Trash2,
  ExternalLink,
  Zap,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

export default function ExchangeWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<WorkspaceData | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Dialog States
  const [manualPlanOpen, setManualPlanOpen] = useState(false);
  const [aiPlanOpen, setAiPlanOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestedPlan, setAiSuggestedPlan] = useState<any | null>(null);

  const [addTopicOpen, setAddTopicOpen] = useState(false);
  const [addResourceOpen, setAddResourceOpen] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  const [scheduleSessionOpen, setScheduleSessionOpen] = useState(false);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form Field States
  const [planTitle, setPlanTitle] = useState("");
  const [planDesc, setPlanDesc] = useState("");
  const [topicTitle, setTopicTitle] = useState("");
  const [topicDesc, setTopicDesc] = useState("");

  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [resourceType, setResourceType] = useState<"LINK" | "FILE" | "VIDEO" | "DOCUMENT" | "GITHUB">("LINK");

  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionTopicId, setSessionTopicId] = useState<string>("");
  const [sessionDate, setSessionDate] = useState("");
  const [sessionTime, setSessionTime] = useState("");
  const [sessionDuration, setSessionDuration] = useState("60");
  const [sessionNotes, setSessionNotes] = useState("");

  const loadWorkspace = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user && id) {
        setCurrentUserId(user.id);
        const res = await fetchWorkspaceData(id, user.id);
        setData(res);
      }
    } catch (err) {
      console.error("Workspace load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-8">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  if (!data || !data.exchange) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4 font-sans">
        <h2 className="text-xl font-bold text-foreground">Exchange Workspace Unavailable</h2>
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

  const { exchange, peerUser, userRole, plan, sessions, upcomingSession, progressPercent, totalTopics, completedTopics, isMutualComplete, hasRated } = data;
  const peerName = peerUser?.full_name || "Exchange Partner";
  const peerUsername = peerUser?.username || "student";

  // Handlers
  const handleCreateManualPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId || !planTitle.trim()) return;

    setActionLoading(true);
    const initialTopics = topicTitle.trim() ? [{ title: topicTitle.trim(), description: topicDesc.trim() }] : [];
    const res = await createManualLearningPlan(exchange.id, currentUserId, planTitle, planDesc, initialTopics);
    setActionLoading(false);

    if (res.success) {
      toast.success("Learning plan created!");
      setManualPlanOpen(false);
      setPlanTitle("");
      setPlanDesc("");
      setTopicTitle("");
      setTopicDesc("");
      await loadWorkspace();
    } else {
      toast.error(res.error || "Failed to create plan.");
    }
  };

  const handleGenerateAIPlan = async () => {
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/generate-learning-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exchangeId: exchange.id }),
      });

      const json = await res.json();
      if (json.success && json.plan) {
        setAiSuggestedPlan(json.plan);
        setAiPlanOpen(true);
      } else {
        toast.error(json.message || "Failed to generate AI learning plan.");
      }
    } catch (err) {
      toast.error("Error generating AI learning plan.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleAcceptAIPlan = async () => {
    if (!currentUserId || !aiSuggestedPlan) return;

    setActionLoading(true);
    const res = await createManualLearningPlan(
      exchange.id,
      currentUserId,
      aiSuggestedPlan.title || "AI Learning Plan",
      aiSuggestedPlan.description || "",
      aiSuggestedPlan.topics || []
    );
    setActionLoading(false);

    if (res.success) {
      toast.success("AI Learning plan saved to workspace!");
      setAiPlanOpen(false);
      setAiSuggestedPlan(null);
      await loadWorkspace();
    } else {
      toast.error(res.error || "Failed to save AI learning plan.");
    }
  };

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId || !plan || !topicTitle.trim()) return;

    setActionLoading(true);
    const res = await createLearningTopic(plan.id, currentUserId, topicTitle, topicDesc);
    setActionLoading(false);

    if (res.success) {
      toast.success("Topic added to learning plan!");
      setAddTopicOpen(false);
      setTopicTitle("");
      setTopicDesc("");
      await loadWorkspace();
    } else {
      toast.error(res.error || "Failed to add topic.");
    }
  };

  const handleToggleTopic = async (topic: LearningTopicItem) => {
    if (!currentUserId) return;
    const res = await toggleTopicStudentCompletion(topic.id, exchange.id, currentUserId, userRole);

    if (res.success) {
      if (res.isNowCompleted) {
        toast.success(`Topic "${topic.title}" completed by both partners!`);
      } else {
        toast.info("Topic completion status updated.");
      }
      await loadWorkspace();
    } else {
      toast.error(res.error || "Failed to update topic.");
    }
  };

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId || !selectedTopicId || !resourceTitle.trim() || !resourceUrl.trim()) return;

    setActionLoading(true);
    const res = await addTopicResource(selectedTopicId, currentUserId, resourceTitle, resourceUrl, resourceType);
    setActionLoading(false);

    if (res.success) {
      toast.success("Resource attached to topic!");
      setAddResourceOpen(false);
      setResourceTitle("");
      setResourceUrl("");
      setSelectedTopicId(null);
      await loadWorkspace();
    } else {
      toast.error(res.error || "Failed to add resource.");
    }
  };

  const handleScheduleSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId || !sessionTitle.trim() || !sessionDate || !sessionTime) return;

    setActionLoading(true);
    const res = await scheduleLearningSession(
      exchange.id,
      currentUserId,
      sessionTopicId || null,
      sessionTitle,
      sessionDate,
      sessionTime,
      parseInt(sessionDuration) || 60,
      sessionNotes
    );
    setActionLoading(false);

    if (res.success) {
      toast.success("Learning session scheduled!");
      setScheduleSessionOpen(false);
      setSessionTitle("");
      setSessionDate("");
      setSessionTime("");
      setSessionNotes("");
      await loadWorkspace();
    } else {
      toast.error(res.error || "Failed to schedule session.");
    }
  };

  const handleConfirmCompletion = async () => {
    if (!currentUserId) return;

    setActionLoading(true);
    const res = await confirmExchangeCompletion(exchange.id, currentUserId, userRole);
    setActionLoading(false);

    if (res.success) {
      if (res.isFullyCompleted) {
        toast.success("Skill exchange fully completed! You can now rate your partner.");
      } else {
        toast.info("Exchange completion requested! Waiting for partner confirmation.");
      }
      await loadWorkspace();
    } else {
      toast.error(res.error || "Failed to complete exchange.");
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto font-sans animate-in fade-in-50 duration-300 pb-12">
      {/* Top Breadcrumb Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="text-xs">
          <Link href="/exchanges">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Exchanges
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <Badge
            variant={exchange.status === "active" ? "teaching" : "outline"}
            className="text-xs font-semibold capitalize px-3 py-1"
          >
            ● {exchange.status} Workspace
          </Badge>
        </div>
      </div>

      {/* Main Workspace Hero Card */}
      <Card className="border-border shadow-sm bg-card overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-teal-900 via-emerald-800 to-teal-950 text-white p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-amber-400 shrink-0">
                <AvatarImage src={peerUser?.avatar_url || ""} alt={peerName} />
                <AvatarFallback className="bg-emerald-950 text-white font-bold text-lg">
                  {getInitials(peerName)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                    Exchange with {peerName}
                  </h1>
                </div>
                <p className="text-xs text-emerald-100/90">
                  @{peerUsername} • {peerUser?.university || "University Student"}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <SkillBadge
                    name={exchange.teaching_skill?.name || "Teaching Skill"}
                    category={exchange.teaching_skill?.category}
                    level="Teaching"
                    type="teaching"
                  />
                  <span className="text-amber-300 font-bold text-xs">↔</span>
                  <SkillBadge
                    name={exchange.learning_skill?.name || "Learning Skill"}
                    category={exchange.learning_skill?.category}
                    level="Learning"
                    type="learning"
                  />
                </div>
              </div>
            </div>

            {/* Overall Progress Widget */}
            <div className="bg-white/10 backdrop-blur border border-white/20 p-4 rounded-xl text-center sm:min-w-[180px]">
              <span className="text-[11px] font-medium text-emerald-200 uppercase tracking-wider block">
                Plan Completion
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 my-1">
                {progressPercent}%
              </div>
              <Progress value={progressPercent} className="h-2 bg-white/20" />
              <p className="text-[10px] text-emerald-100/80 mt-1.5">
                {completedTopics} of {totalTopics} topics completed
              </p>
            </div>
          </div>
        </CardHeader>

        {/* Workspace Quick Actions Toolbar */}
        <CardContent className="p-4 sm:p-6 bg-card border-t border-border flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs border-none"
              onClick={() => setScheduleSessionOpen(true)}
            >
              <Calendar className="h-4 w-4 mr-2" /> Start / Schedule Session
            </Button>

            {upcomingSession ? (
              <Button asChild size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold">
                <Link href={`/exchanges/${exchange.id}/sessions/${upcomingSession.id}`}>
                  <Video className="h-4 w-4 mr-2" /> Join Video Call
                </Link>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setScheduleSessionOpen(true)}
              >
                <Video className="h-4 w-4 mr-2 text-muted-foreground" /> Join Video Call
              </Button>
            )}

            <Button asChild variant="outline" size="sm" className="text-xs">
              <Link href="/messages">
                <MessageSquare className="h-4 w-4 mr-2 text-primary" /> Message Partner
              </Link>
            </Button>
          </div>

          {/* Completion Status & Rate Action */}
          <div className="flex items-center gap-2">
            {exchange.status === "active" && (
              <Button
                variant="emerald"
                size="sm"
                onClick={handleConfirmCompletion}
                disabled={actionLoading}
                className="font-semibold text-xs"
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                {progressPercent === 100 ? "Complete Exchange" : "Confirm Completion"}
              </Button>
            )}

            {exchange.status === "completed" && (
              hasRated ? (
                <Badge variant="outline" className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-3 py-1">
                  <Star className="h-3.5 w-3.5 mr-1 fill-amber-500 text-amber-500" /> Rated
                </Badge>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRatingModalOpen(true)}
                  className="text-amber-600 border-amber-500/30 hover:bg-amber-50 text-xs"
                >
                  <Star className="h-4 w-4 mr-1.5 fill-amber-500 text-amber-500" /> Rate Partner
                </Button>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Session Banner Card */}
      {upcomingSession && (
        <Card className="border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs">
          <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold">
                <Clock className="h-3.5 w-3.5 text-emerald-600" /> Upcoming Session
              </div>
              <h3 className="text-base font-bold text-foreground pt-1">
                {upcomingSession.title}
              </h3>
              <p className="text-xs text-muted-foreground flex items-center gap-3">
                <span>🗓 {new Date(upcomingSession.scheduled_date).toLocaleDateString()}</span>
                <span>⏰ {upcomingSession.start_time}</span>
                <span>⏱ {upcomingSession.duration_minutes} mins</span>
              </p>
            </div>
            <Button asChild size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shrink-0">
              <Link href={`/exchanges/${exchange.id}/sessions/${upcomingSession.id}`}>
                <Video className="h-4 w-4 mr-2" /> Join Session & Video
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Learning Plan Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" /> Shared Learning Plan
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Collaborative roadmap for {exchange.teaching_skill?.name} ↔ {exchange.learning_skill?.name}. Both partners mark topics completed.
            </p>
          </div>

          {plan && (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setAddTopicOpen(true)} className="text-xs">
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Topic
              </Button>
              <Button size="sm" variant="secondary" onClick={handleGenerateAIPlan} disabled={aiLoading} className="text-xs text-primary">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" /> AI Topic Suggestions
              </Button>
            </div>
          )}
        </div>

        {/* Empty State: No Plan Created Yet */}
        {!plan ? (
          <Card className="p-8 sm:p-10 text-center border-dashed border-border bg-card">
            <div className="max-w-md mx-auto space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-primary mx-auto">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">No Learning Plan Created Yet</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Create a structured roadmap for your peer exchange manually, or let Gemini AI analyze your exchange skills to generate a recommended study outline.
              </p>

              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <Button size="sm" onClick={() => setManualPlanOpen(true)} className="font-semibold text-xs">
                  <Plus className="h-4 w-4 mr-1.5" /> Create Manually
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleGenerateAIPlan}
                  disabled={aiLoading}
                  className="text-primary border-primary/30 text-xs font-semibold"
                >
                  {aiLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-1.5 text-amber-500" />
                  )}
                  Generate with AI
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Learning Plan Summary Banner */}
            <Card className="border-border shadow-xs bg-muted/30">
              <CardContent className="p-4 sm:p-5">
                <h3 className="text-base font-bold text-foreground">{plan.title}</h3>
                {plan.description && (
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{plan.description}</p>
                )}
              </CardContent>
            </Card>

            {/* Topics List */}
            {plan.topics.length === 0 ? (
              <Card className="p-6 text-center border-dashed border-border">
                <p className="text-xs text-muted-foreground">No topics added to this plan yet.</p>
                <Button size="sm" variant="outline" onClick={() => setAddTopicOpen(true)} className="mt-3 text-xs">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add First Topic
                </Button>
              </Card>
            ) : (
              <div className="space-y-3">
                {plan.topics.map((topic, idx) => {
                  const isUserOne = userRole === "user_one";
                  const myCompleted = isUserOne ? topic.user_one_completed : topic.user_two_completed;
                  const partnerCompleted = isUserOne ? topic.user_two_completed : topic.user_one_completed;
                  const isTopicFullyDone = topic.status === "COMPLETED";

                  return (
                    <Card
                      key={topic.id}
                      className={`border-border shadow-xs transition-all ${
                        isTopicFullyDone
                          ? "bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-500/30"
                          : "bg-card"
                      }`}
                    >
                      <CardContent className="p-4 sm:p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <h4 className="text-sm font-bold text-foreground">{topic.title}</h4>
                              <Badge
                                variant={
                                  isTopicFullyDone
                                    ? "teaching"
                                    : topic.status === "IN_PROGRESS"
                                    ? "secondary"
                                    : "outline"
                                }
                                className="text-[10px] font-medium uppercase"
                              >
                                {topic.status.replace("_", " ")}
                              </Badge>
                            </div>

                            {topic.description && (
                              <p className="text-xs text-muted-foreground pl-8">{topic.description}</p>
                            )}
                          </div>

                          {/* Mutual Completion Checkboxes */}
                          <div className="flex items-center gap-4 bg-muted/50 p-2 rounded-xl border border-border/60 shrink-0">
                            <div
                              className="flex items-center gap-2 cursor-pointer text-xs"
                              onClick={() => handleToggleTopic(topic)}
                            >
                              <Checkbox checked={myCompleted} onCheckedChange={() => handleToggleTopic(topic)} />
                              <span className="text-[11px] font-medium text-foreground">You (Me)</span>
                            </div>

                            <div className="h-4 w-px bg-border" />

                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              {partnerCompleted ? (
                                <CheckSquare className="h-4 w-4 text-emerald-600" />
                              ) : (
                                <Square className="h-4 w-4 text-muted-foreground/60" />
                              )}
                              <span className="text-[11px] font-medium">{peerName.split(" ")[0]}</span>
                            </div>
                          </div>
                        </div>

                        {/* Topic Resources Row */}
                        <div className="pt-2 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-semibold text-muted-foreground">Resources:</span>
                            {topic.resources.length === 0 ? (
                              <span className="text-[11px] text-muted-foreground/70 italic">None attached</span>
                            ) : (
                              topic.resources.map((res) => (
                                <a
                                  key={res.id}
                                  href={res.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-background border border-border text-[11px] font-medium text-primary hover:underline"
                                >
                                  {res.resource_type === "GITHUB" ? (
                                    <Github className="h-3 w-3" />
                                  ) : res.resource_type === "VIDEO" ? (
                                    <Video className="h-3 w-3 text-rose-500" />
                                  ) : (
                                    <LinkIcon className="h-3 w-3 text-amber-500" />
                                  )}
                                  {res.title}
                                  <ExternalLink className="h-2.5 w-2.5 text-muted-foreground" />
                                </a>
                              ))
                            )}
                          </div>

                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-[11px] text-primary h-7 px-2.5"
                            onClick={() => {
                              setSelectedTopicId(topic.id);
                              setAddResourceOpen(true);
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Add Resource
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Manual Plan Dialog */}
      <Dialog open={manualPlanOpen} onOpenChange={setManualPlanOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Learning Plan</DialogTitle>
            <DialogDescription className="text-xs">
              Define a title and initial study topic for your peer skill exchange.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateManualPlan} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Plan Title</label>
              <Input
                placeholder="e.g. React & TypeScript Study Roadmap"
                value={planTitle}
                onChange={(e) => setPlanTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Description (Optional)</label>
              <Textarea
                placeholder="Overview of study goals..."
                value={planDesc}
                onChange={(e) => setPlanDesc(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-1.5 border-t border-border pt-3">
              <label className="font-semibold text-foreground">Initial Topic Title (Optional)</label>
              <Input
                placeholder="e.g. 1. React Components & JSX"
                value={topicTitle}
                onChange={(e) => setTopicTitle(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setManualPlanOpen(false)} size="sm">
                Cancel
              </Button>
              <Button type="submit" disabled={actionLoading || !planTitle.trim()} size="sm">
                {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                Save Learning Plan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* AI Suggested Plan Preview Dialog */}
      <Dialog open={aiPlanOpen} onOpenChange={setAiPlanOpen}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5 text-amber-500" /> AI Suggested Learning Plan
            </DialogTitle>
            <DialogDescription className="text-xs">
              Generated by Gemini AI based on your exchange skills. Review and save to your workspace.
            </DialogDescription>
          </DialogHeader>

          {aiSuggestedPlan && (
            <div className="space-y-4 text-xs">
              <div className="bg-muted/40 p-3 rounded-xl border border-border">
                <h4 className="font-bold text-foreground text-sm">{aiSuggestedPlan.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{aiSuggestedPlan.description}</p>
              </div>

              <div className="space-y-2">
                <h5 className="font-bold text-foreground">Suggested Topics ({aiSuggestedPlan.topics?.length || 0}):</h5>
                {aiSuggestedPlan.topics?.map((t: any, i: number) => (
                  <div key={i} className="p-3 bg-card rounded-lg border border-border/80 space-y-0.5">
                    <p className="font-semibold text-foreground">
                      {i + 1}. {t.title}
                    </p>
                    <p className="text-muted-foreground text-[11px]">{t.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter className="pt-3 border-t border-border flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={handleGenerateAIPlan} disabled={aiLoading} size="sm">
              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Regenerate
            </Button>
            <Button type="button" onClick={handleAcceptAIPlan} disabled={actionLoading} size="sm">
              {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
              Add to Workspace Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Topic Dialog */}
      <Dialog open={addTopicOpen} onOpenChange={setAddTopicOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Learning Topic</DialogTitle>
            <DialogDescription className="text-xs">
              Add a new topic to your shared study roadmap.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddTopic} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Topic Title</label>
              <Input
                placeholder="e.g. State & Lifecycle Hooks"
                value={topicTitle}
                onChange={(e) => setTopicTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Description (Optional)</label>
              <Textarea
                placeholder="What will you learn in this topic?"
                value={topicDesc}
                onChange={(e) => setTopicDesc(e.target.value)}
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddTopicOpen(false)} size="sm">
                Cancel
              </Button>
              <Button type="submit" disabled={actionLoading || !topicTitle.trim()} size="sm">
                Add Topic
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Resource Dialog */}
      <Dialog open={addResourceOpen} onOpenChange={setAddResourceOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Attach Resource to Topic</DialogTitle>
            <DialogDescription className="text-xs">
              Share documentation, code repositories, or tutorial links with your partner.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddResource} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Resource Title</label>
              <Input
                placeholder="e.g. React Hooks Official Docs"
                value={resourceTitle}
                onChange={(e) => setResourceTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">URL / Link</label>
              <Input
                placeholder="https://react.dev/reference/react/hooks"
                value={resourceUrl}
                onChange={(e) => setResourceUrl(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Resource Type</label>
              <Select value={resourceType} onValueChange={(val: any) => setResourceType(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LINK">Link / Website</SelectItem>
                  <SelectItem value="GITHUB">GitHub Repository</SelectItem>
                  <SelectItem value="VIDEO">Video Tutorial</SelectItem>
                  <SelectItem value="DOCUMENT">Document / PDF</SelectItem>
                  <SelectItem value="FILE">File</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddResourceOpen(false)} size="sm">
                Cancel
              </Button>
              <Button type="submit" disabled={actionLoading || !resourceTitle.trim() || !resourceUrl.trim()} size="sm">
                Attach Resource
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Schedule Session Dialog */}
      <Dialog open={scheduleSessionOpen} onOpenChange={setScheduleSessionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule 1-to-1 Learning Session</DialogTitle>
            <DialogDescription className="text-xs">
              Schedule a live video learning meeting with your partner.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleScheduleSession} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Session Title</label>
              <Input
                placeholder="e.g. React Hooks Deep Dive"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                required
              />
            </div>

            {plan && plan.topics.length > 0 && (
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Related Topic (Optional)</label>
                <Select value={sessionTopicId} onValueChange={setSessionTopicId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {plan.topics.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Date</label>
                <Input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Start Time</label>
                <Input
                  type="time"
                  value={sessionTime}
                  onChange={(e) => setSessionTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Duration (Minutes)</label>
              <Input
                type="number"
                value={sessionDuration}
                onChange={(e) => setSessionDuration(e.target.value)}
                min="15"
                max="180"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Session Notes (Optional)</label>
              <Textarea
                placeholder="Topics to discuss, preparation instructions..."
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setScheduleSessionOpen(false)} size="sm">
                Cancel
              </Button>
              <Button type="submit" disabled={actionLoading || !sessionTitle.trim() || !sessionDate || !sessionTime} size="sm">
                Schedule Session
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Rating Dialog Modal */}
      {peerUser && (
        <RatingModal
          open={ratingModalOpen}
          onOpenChange={setRatingModalOpen}
          exchangeId={exchange.id}
          reviewerId={currentUserId || ""}
          reviewedUser={peerUser}
          onSuccess={loadWorkspace}
        />
      )}
    </div>
  );
}
