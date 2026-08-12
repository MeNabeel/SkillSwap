"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { SkillBadge } from "@/components/skills/SkillBadge";
import { StudentCard } from "@/components/discover/StudentCard";
import { fetchDiscoverStudents } from "@/lib/discover/queries";
import { fetchUserProfile, calculateProfileCompletion } from "@/lib/profiles/queries";
import { StudentCardData } from "@/lib/discover/types";
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
} from "lucide-react";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [teachingSkills, setTeachingSkills] = useState<any[]>([]);
  const [learningSkills, setLearningSkills] = useState<any[]>([]);
  const [recommendedPeers, setRecommendedPeers] = useState<StudentCardData[]>([]);
  const [completionPercent, setCompletionPercent] = useState<number>(0);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const userFullProfile = await fetchUserProfile(user.id);

          if (userFullProfile) {
            setProfile(userFullProfile);
            setCurrentUserProfile(userFullProfile);
            setTeachingSkills(userFullProfile.teaching_skills);
            setLearningSkills(userFullProfile.learning_skills);
            setCompletionPercent(userFullProfile.completion_percentage);

            // Fetch Top 3 Dynamic Recommended Peer Matches from Database
            const discoverRes = await fetchDiscoverStudents(
              { pageSize: 3, sortBy: "best_match" },
              userFullProfile
            );
            setRecommendedPeers(discoverRes.students);
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
      {/* Welcome Banner Card */}
      <div className="rounded-2xl bg-gradient-to-r from-primary via-indigo-600 to-indigo-700 p-6 sm:p-8 text-primary-foreground shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur text-xs font-medium mb-3">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" /> Skill Exchange Network
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome back, {userName}!
          </h1>
          <p className="mt-2 text-sm text-primary-foreground/80 leading-relaxed">
            Ready to exchange knowledge today? Find student matches, share your expertise in programming or design, and learn new skills democratically.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="sm" variant="secondary" className="font-semibold shadow-sm">
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

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" /> Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="card-hover border-border">
            <CardHeader className="pb-3">
              <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-primary mb-1">
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
              <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 mb-1">
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
              <div className="h-9 w-9 rounded-xl bg-violet-50 dark:bg-violet-950/50 flex items-center justify-center text-violet-600 mb-1">
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
              <CardTitle className="text-base flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" /> Skills You Teach
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
              <CardTitle className="text-base flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                <BookOpen className="h-5 w-5" /> Skills You Want to Learn
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
            <Sparkles className="h-5 w-5 text-violet-600" /> Recommended Peer Matches
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
