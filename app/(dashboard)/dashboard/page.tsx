"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SkillBadge } from "@/components/skills/SkillBadge";
import { StudentCard } from "@/components/discover/StudentCard";
import { fetchDiscoverStudents } from "@/lib/discover/queries";
import { fetchUserProfile } from "@/lib/profiles/queries";
import { fetchUserExchanges, ExchangeItem } from "@/lib/exchanges/queries";
import { fetchUserRequests } from "@/lib/requests/queries";
import { fetchUserRatingSummary } from "@/lib/ratings/queries";
import { StudentCardData } from "@/lib/discover/types";
import { getInitials } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  Compass,
  Edit,
  Plus,
  Sparkles,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  Zap,
  Users,
  Repeat,
  GitPullRequest,
  Star,
  MessageSquare,
} from "lucide-react";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [teachingSkills, setTeachingSkills] = useState<any[]>([]);
  const [learningSkills, setLearningSkills] = useState<any[]>([]);
  const [recommendedPeers, setRecommendedPeers] = useState<StudentCardData[]>([]);
  const [activeExchangesList, setActiveExchangesList] = useState<ExchangeItem[]>([]);
  const [completionPercent, setCompletionPercent] = useState<number>(0);

  // Dynamic Metrics State
  const [activeExchangesCount, setActiveExchangesCount] = useState<number>(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(0);
  const [completedExchangesCount, setCompletedExchangesCount] = useState<number>(0);
  const [userRating, setUserRating] = useState<{ avg: number | null; count: number }>({
    avg: null,
    count: 0,
  });

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const userFullProfile = await fetchUserProfile(user.id);

          if (userFullProfile) {
            setProfile(userFullProfile);
            setTeachingSkills(userFullProfile.teaching_skills);
            setLearningSkills(userFullProfile.learning_skills);
            setCompletionPercent(userFullProfile.completion_percentage);

            // 1. Fetch Top 3 Dynamic Recommended Peer Matches
            const discoverRes = await fetchDiscoverStudents(
              { pageSize: 3, sortBy: "best_match" },
              userFullProfile
            );
            setRecommendedPeers(discoverRes.students);

            // 2. Fetch User Active Exchanges
            const exchRes = await fetchUserExchanges(user.id);
            setActiveExchangesList(exchRes.active);
            setActiveExchangesCount(exchRes.active.length);
            setCompletedExchangesCount(exchRes.completed.length);

            // 3. Fetch User Requests
            const reqRes = await fetchUserRequests(user.id);
            setPendingRequestsCount(reqRes.incoming.length + reqRes.sent.length);

            // 4. Fetch User Rating Summary
            const ratingRes = await fetchUserRatingSummary(user.id);
            setUserRating({
              avg: ratingRes.averageRating,
              count: ratingRes.ratingCount,
            });
          }
        } else {
          // Unauthenticated fallback view for public dashboard preview
          const discoverRes = await fetchDiscoverStudents({ pageSize: 3, sortBy: "best_match" }, null);
          setRecommendedPeers(discoverRes.students);
        }
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const userName = profile?.full_name || "Student";

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300 max-w-7xl mx-auto font-sans">
      {/* Welcome Banner Card - Deep Emerald & Warm Amber Styling */}
      <div className="rounded-2xl bg-gradient-to-r from-teal-900 via-emerald-800 to-teal-950 p-6 sm:p-8 text-white shadow-md relative overflow-hidden border border-emerald-700/50">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur text-xs font-medium mb-3 text-amber-200 border border-amber-300/20">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Skill Exchange Network
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Welcome back, {userName}!
          </h1>
          <p className="mt-2 text-sm text-emerald-100/90 leading-relaxed">
            Ready to exchange knowledge today? Find student matches, share your expertise in programming, academics, or design, and learn new skills democratically.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-sm border-none">
              <Link href="/discover">
                <Compass className="h-4 w-4 mr-2" /> Discover Students
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Link href="/profile/edit">
                <Edit className="h-4 w-4 mr-2" /> Update Skills
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Dynamic Dashboard Metrics Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-border shadow-xs bg-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-700 shrink-0">
              <Repeat className="h-5 w-5" />
            </div>
            <div>
              {loading ? (
                <Skeleton className="h-5 w-10 mb-1" />
              ) : (
                <p className="text-lg font-bold text-foreground">{activeExchangesCount}</p>
              )}
              <p className="text-[11px] text-muted-foreground font-medium">Active Exchanges</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs bg-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 shrink-0">
              <GitPullRequest className="h-5 w-5" />
            </div>
            <div>
              {loading ? (
                <Skeleton className="h-5 w-10 mb-1" />
              ) : (
                <p className="text-lg font-bold text-foreground">{pendingRequestsCount}</p>
              )}
              <p className="text-[11px] text-muted-foreground font-medium">Pending Requests</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs bg-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-700 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              {loading ? (
                <Skeleton className="h-5 w-10 mb-1" />
              ) : (
                <p className="text-lg font-bold text-foreground">{completedExchangesCount}</p>
              )}
              <p className="text-[11px] text-muted-foreground font-medium">Completed</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs bg-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-500 shrink-0">
              <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
            </div>
            <div>
              {loading ? (
                <Skeleton className="h-5 w-12 mb-1" />
              ) : (
                <p className="text-lg font-bold text-foreground">
                  {userRating.avg ? userRating.avg.toFixed(1) : "New"}
                </p>
              )}
              <p className="text-[11px] text-muted-foreground font-medium">
                {userRating.count > 0 ? `${userRating.count} reviews` : "Peer Rating"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dynamic Profile Completion Status Card */}
      {profile && completionPercent < 100 && (
        <Card className="border-border shadow-xs bg-card">
          <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">
                  Profile Completion
                </span>
                <span className="text-xs font-bold text-primary">{completionPercent}%</span>
              </div>
              <Progress value={completionPercent} className="h-2 mt-1.5" />
              <p className="text-[11px] text-muted-foreground pt-1">
                Complete your profile bio, degree, and skills to increase your peer match compatibility.
              </p>
            </div>
            <Button asChild size="sm" variant="outline" className="text-xs shrink-0">
              <Link href="/profile/edit">Complete Profile</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Active Skill Exchanges & Accepted Requests Section on Dashboard */}
      {activeExchangesList.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Repeat className="h-5 w-5 text-primary" /> Active Skill Exchanges
            </h2>
            <Button variant="ghost" size="sm" asChild className="text-xs text-primary">
              <Link href="/exchanges">View All Exchanges</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeExchangesList.map((item) => {
              const peerName = item.peerUser?.full_name || "Student Partner";
              const peerUsername = item.peerUser?.username || "student";

              return (
                <Card key={item.id} className="border-border shadow-xs card-hover flex flex-col justify-between">
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

                      <Badge variant="teaching" className="text-[11px] font-semibold capitalize flex items-center">
                        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse" /> Active Workspace
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-2 bg-muted/40 p-2.5 rounded-xl border border-border/50">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                          Teaching:
                        </span>
                        <SkillBadge
                          name={item.teaching_skill?.name || "Skill"}
                          category={item.teaching_skill?.category}
                          level="Standard"
                          type="teaching"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block mb-1">
                          Learning:
                        </span>
                        <SkillBadge
                          name={item.learning_skill?.name || "Skill"}
                          category={item.learning_skill?.category}
                          level="Standard"
                          type="learning"
                        />
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-3 border-t border-border flex items-center gap-2">
                    <Button asChild size="sm" className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold flex-1 shadow-xs border-none">
                      <Link href={`/exchanges/${item.id}`}>
                        <BookOpen className="h-3.5 w-3.5 mr-1.5" /> Open Workspace
                      </Link>
                    </Button>

                    <Button asChild size="sm" variant="outline" className="text-xs flex-1">
                      <Link href="/messages">
                        <MessageSquare className="h-3.5 w-3.5 mr-1.5 text-primary" /> Open Chat
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" /> Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="card-hover border-border">
            <CardHeader className="pb-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-primary mb-1">
                <Compass className="h-5 w-5" />
              </div>
              <CardTitle className="text-base">Discover Peers</CardTitle>
              <CardDescription className="text-xs">
                Filter students by skills, degree, and availability
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild variant="ghost" size="sm" className="w-full text-xs justify-between group">
                <Link href="/discover">
                  Browse Matches <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="card-hover border-border">
            <CardHeader className="pb-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-700 mb-1">
                <Edit className="h-5 w-5" />
              </div>
              <CardTitle className="text-base">Edit Profile</CardTitle>
              <CardDescription className="text-xs">
                Update your bio, university details, and availability
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild variant="ghost" size="sm" className="w-full text-xs justify-between group">
                <Link href="/profile/edit">
                  Edit Details <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="card-hover border-border">
            <CardHeader className="pb-3">
              <div className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 mb-1">
                <Plus className="h-5 w-5" />
              </div>
              <CardTitle className="text-base">Add New Skill</CardTitle>
              <CardDescription className="text-xs">
                Expand your teaching offerings or learning goals
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild variant="ghost" size="sm" className="w-full text-xs justify-between group">
                <Link href="/profile/edit">
                  Manage Skills <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Skill Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Teaching Skills Summary */}
        <Card className="shadow-sm border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Skills You Teach
              </CardTitle>
              <Badge variant="teaching">
                {teachingSkills.length} active
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Subjects and technologies you share with other students
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-3/4" />
              </div>
            ) : teachingSkills.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground border border-dashed rounded-xl p-4">
                No teaching skills added yet. Add skills you can teach.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {teachingSkills.map((item) => (
                  <SkillBadge
                    key={item.skillId || item.id}
                    name={item.name || item.skill?.name || "Skill"}
                    category={item.category || item.skill?.category}
                    level={item.level || item.experience_level}
                    type="teaching"
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Learning Skills Summary */}
        <Card className="shadow-sm border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2 text-amber-800 dark:text-amber-300">
                <BookOpen className="h-5 w-5 text-amber-600" /> Skills You Want to Learn
              </CardTitle>
              <Badge variant="learning">
                {learningSkills.length} goals
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Target skills you wish to learn from peer mentors
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-3/4" />
              </div>
            ) : learningSkills.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground border border-dashed rounded-xl p-4">
                No learning goals added yet. Add skills you want to learn.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {learningSkills.map((item) => (
                  <SkillBadge
                    key={item.skillId || item.id}
                    name={item.name || item.skill?.name || "Skill"}
                    category={item.category || item.skill?.category}
                    level={item.level || item.desired_level}
                    type="learning"
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dynamic Recommended Peer Matches Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-600" /> Recommended Peer Matches
          </h2>
          <Button variant="ghost" size="sm" asChild className="text-xs text-primary">
            <Link href="/discover">View All Matches</Link>
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-16 w-full rounded-lg" />
              </Card>
            ))}
          </div>
        ) : recommendedPeers.length === 0 ? (
          <Card className="p-8 text-center border-dashed border-border">
            <div className="flex flex-col items-center justify-center space-y-2">
              <Users className="h-8 w-8 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                No public student matches available yet. Check back soon or invite fellow classmates!
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedPeers.map((student) => (
              <StudentCard key={student.id} student={student} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
