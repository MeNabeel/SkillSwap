"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SkillBadge } from "@/components/skills/SkillBadge";
import { MatchReasons } from "@/components/discover/MatchReasons";
import { RequestExchangeModal } from "@/components/requests/RequestExchangeModal";
import { fetchStudentById } from "@/lib/discover/queries";
import { fetchUserRatingSummary, RatingSummary } from "@/lib/ratings/queries";
import { fetchUserExchanges } from "@/lib/exchanges/queries";
import { StudentCardData } from "@/lib/discover/types";
import { getInitials } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  GraduationCap,
  MapPin,
  Clock,
  Briefcase,
  CheckCircle2,
  BookOpen,
  ArrowLeft,
  UserPlus,
  Edit,
  Star,
  Repeat,
  Sparkles,
  AlertCircle,
  UserCheck,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<StudentCardData | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [ratingSummary, setRatingSummary] = useState<RatingSummary>({
    averageRating: null,
    ratingCount: 0,
    reviews: [],
  });
  const [completedExchangesCount, setCompletedExchangesCount] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        let currentUserProfile = null;
        if (user) {
          const { data: p } = await (supabase as any)
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (p) {
            const { data: teachData } = await (supabase as any)
              .from("user_teaching_skills")
              .select("*, skill:skills(*)")
              .eq("user_id", user.id);

            const { data: learnData } = await (supabase as any)
              .from("user_learning_skills")
              .select("*, skill:skills(*)")
              .eq("user_id", user.id);

            currentUserProfile = {
              id: p.id,
              full_name: p.full_name,
              username: p.username,
              university: p.university,
              experience_level: p.experience_level,
              availability: p.availability,
              teaching_skills: (teachData || []).map((t: any) => ({
                skillId: t.skill_id,
                name: t.skill?.name || "Skill",
                category: t.skill?.category || "General",
                level: t.experience_level,
              })),
              learning_skills: (learnData || []).map((l: any) => ({
                skillId: l.skill_id,
                name: l.skill?.name || "Skill",
                category: l.skill?.category || "General",
                level: l.desired_level,
              })),
            };
            setCurrentUser(currentUserProfile);
          }
        }

        if (id) {
          const studentData = await fetchStudentById(id, currentUserProfile);
          setStudent(studentData);

          // Fetch dynamic ratings and completed exchange stats
          const ratingsRes = await fetchUserRatingSummary(id);
          setRatingSummary(ratingsRes);

          const exchRes = await fetchUserExchanges(id);
          setCompletedExchangesCount(exchRes.completed.length);
        }
      } catch (err) {
        console.error("Student detail load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-8">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4 font-sans">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Student Not Found</h2>
        <p className="text-xs text-muted-foreground">
          This profile does not exist or has been set to private by the student.
        </p>
        <Button asChild size="sm">
          <Link href="/discover">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Discover
          </Link>
        </Button>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === student.id;

  const handleOpenRequestModal = () => {
    if (!currentUser) {
      toast.info("Please sign in to request a skill exchange.");
      router.push(`/login?redirectTo=/students/${student.id}`);
      return;
    }
    setRequestModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans animate-in fade-in-50 duration-300">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="text-xs">
          <Link href="/discover">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Discover
          </Link>
        </Button>
      </div>

      {/* Hero Header Card */}
      <Card className="border-border shadow-sm overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary via-indigo-600 to-violet-600 relative" />
        <CardContent className="pt-0 relative px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 mb-4">
            <div className="flex items-end gap-4">
              <Avatar className="h-24 w-24 border-4 border-card shadow-md">
                <AvatarImage src={student.avatar_url || ""} alt={student.full_name} />
                <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                  {getInitials(student.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="pb-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-foreground">{student.full_name}</h1>
                  {student.matchScore && (
                    <Badge variant="teaching" className="font-bold text-xs">
                      <Sparkles className="h-3 w-3 mr-1" /> {student.matchScore}% Match
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-medium">@{student.username}</p>
              </div>
            </div>

            {/* Context-sensitive CTA Button */}
            {isOwnProfile ? (
              <Button asChild size="sm" variant="outline">
                <Link href="/profile/edit">
                  <Edit className="h-4 w-4 mr-2" /> Edit Profile
                </Link>
              </Button>
            ) : (
              <Button size="sm" onClick={handleOpenRequestModal} variant="emerald" className="font-semibold shadow-sm">
                <UserPlus className="h-4 w-4 mr-2" /> Request Skill Exchange
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-border text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary shrink-0" />
              <span>
                {student.degree || "Degree N/A"} • {student.university || "University N/A"} ({student.semester || "Semester N/A"})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <span>{student.location || "Location N/A"}</span>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary shrink-0" />
              <span>{student.availability || "Flexible"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Match Reasons Card (Shown when viewing another student) */}
      {!isOwnProfile && student.matchReasons && (
        <MatchReasons reasons={student.matchReasons} matchScore={student.matchScore || 75} />
      )}

      {/* About & Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">About {student.full_name.split(" ")[0]}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-foreground leading-relaxed">
              {student.bio || "No bio written yet."}
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="outline" className="text-xs">
                <Briefcase className="h-3 w-3 mr-1" /> Level: {student.experience_level || "Intermediate"}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <UserCheck className="h-3 w-3 mr-1 text-emerald-600" /> Verified Student
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Rating Stats Card */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Exchange Ratings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-500">
                <Star className="h-6 w-6 fill-amber-500" />
              </div>
              <div>
                <p className="text-xl font-extrabold text-foreground">
                  {ratingSummary.averageRating ? ratingSummary.averageRating.toFixed(1) : "New Member"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {ratingSummary.ratingCount ? `${ratingSummary.ratingCount} peer reviews` : "No ratings yet"}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <Repeat className="h-3.5 w-3.5 text-primary" /> Completed Exchanges:
              </span>
              <span className="font-bold text-foreground">{completedExchangesCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Peer Reviews History Section */}
      {ratingSummary.reviews.length > 0 && (
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" /> Student Reviews ({ratingSummary.ratingCount})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 divide-y divide-border/60">
            {ratingSummary.reviews.map((rev) => (
              <div key={rev.id} className="pt-3 first:pt-0 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={rev.reviewerAvatar || ""} />
                      <AvatarFallback className="text-[9px]">{getInitials(rev.reviewerName)}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-foreground">{rev.reviewerName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-3 w-3 ${
                          s <= rev.rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {rev.review && <p className="text-muted-foreground italic">"{rev.review}"</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Teaching Skills */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" /> Skills They Can Teach
            </CardTitle>
            <Badge variant="teaching">{student.teaching_skills.length} skills</Badge>
          </div>
          <CardDescription className="text-xs">
            Subjects this student is ready to mentor and exchange
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {student.teaching_skills.map((s) => (
              <SkillBadge
                key={s.skillId}
                name={s.name}
                category={s.category}
                level={s.level}
                type="teaching"
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Learning Goals */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
              <BookOpen className="h-5 w-5" /> Skills They Want to Learn
            </CardTitle>
            <Badge variant="learning">{student.learning_skills.length} goals</Badge>
          </div>
          <CardDescription className="text-xs">
            Target subjects this student wishes to learn from peers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {student.learning_skills.map((s) => (
              <SkillBadge
                key={s.skillId}
                name={s.name}
                category={s.category}
                level={s.level}
                type="learning"
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Request Skill Exchange Dialog Modal */}
      {currentUser && (
        <RequestExchangeModal
          open={requestModalOpen}
          onOpenChange={setRequestModalOpen}
          targetUser={student}
          currentUser={currentUser}
          onSuccess={() => router.push("/requests")}
        />
      )}
    </div>
  );
}
