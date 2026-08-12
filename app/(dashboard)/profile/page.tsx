"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SkillBadge } from "@/components/skills/SkillBadge";
import { getInitials } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  GraduationCap,
  MapPin,
  Clock,
  Briefcase,
  Edit,
  CheckCircle2,
  BookOpen,
  Calendar,
  UserCheck,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [teachingSkills, setTeachingSkills] = useState<any[]>([]);
  const [learningSkills, setLearningSkills] = useState<any[]>([]);

  useEffect(() => {
    async function loadProfile() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data: profileData } = await (supabase as any)
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          setProfile(profileData);

          const { data: teachData } = await (supabase as any)
            .from("user_teaching_skills")
            .select("*, skill:skills(*)")
            .eq("user_id", user.id);

          if (teachData) setTeachingSkills(teachData);

          const { data: learnData } = await (supabase as any)
            .from("user_learning_skills")
            .select("*, skill:skills(*)")
            .eq("user_id", user.id);

          if (learnData) setLearningSkills(learnData);
        }
      } catch (err) {
        console.error("Profile load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  const name = profile?.full_name || "Student User";
  const username = profile?.username ? `@${profile.username}` : "@student";

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in-50 duration-300">
      {/* Profile Header Hero Card */}
      <Card className="border-border shadow-sm overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-primary to-indigo-600 relative" />
        <CardContent className="pt-0 relative px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 mb-4">
            <div className="flex items-end gap-4">
              <Avatar className="h-24 w-24 border-4 border-card shadow-md">
                <AvatarImage src={profile?.avatar_url || ""} alt={name} />
                <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                  {getInitials(name)}
                </AvatarFallback>
              </Avatar>
              <div className="pb-1">
                <h1 className="text-2xl font-bold text-foreground">{name}</h1>
                <p className="text-xs text-muted-foreground font-medium">{username}</p>
              </div>
            </div>

            <Button asChild size="sm" variant="outline">
              <Link href="/profile/edit">
                <Edit className="h-4 w-4 mr-2" /> Edit Profile
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-border text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary shrink-0" />
              <span>
                {profile?.degree || "Degree N/A"} • {profile?.university || "University N/A"} ({profile?.semester || "Semester N/A"})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <span>{profile?.location || "Location N/A"}</span>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary shrink-0" />
              <span>{profile?.availability || "Availability N/A"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bio Section */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">About</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground leading-relaxed">
            {profile?.bio || "No bio added yet. Tell other students about your background, project goals, and interests."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              <Briefcase className="h-3 w-3 mr-1" /> Experience: {profile?.experience_level || "Intermediate"}
            </Badge>
            <Badge variant="outline" className="text-xs">
              <UserCheck className="h-3 w-3 mr-1 text-emerald-600" /> Onboarding Completed
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Teaching Skills Section */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" /> Skills Offered (Teaching)
            </CardTitle>
            <Badge variant="teaching">{teachingSkills.length} skills</Badge>
          </div>
          <CardDescription className="text-xs">
            Subjects and skills this user can teach or mentor
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teachingSkills.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-2">
              No teaching skills listed.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {teachingSkills.map((item) => (
                <SkillBadge
                  key={item.id}
                  name={item.skill?.name || "Skill"}
                  category={item.skill?.category}
                  level={item.experience_level}
                  type="teaching"
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Learning Skills Section */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
              <BookOpen className="h-5 w-5" /> Learning Goals
            </CardTitle>
            <Badge variant="learning">{learningSkills.length} goals</Badge>
          </div>
          <CardDescription className="text-xs">
            Skills this user wants to master through peer exchange
          </CardDescription>
        </CardHeader>
        <CardContent>
          {learningSkills.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-2">
              No learning skills listed.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {learningSkills.map((item) => (
                <SkillBadge
                  key={item.id}
                  name={item.skill?.name || "Skill"}
                  category={item.skill?.category}
                  level={item.desired_level}
                  type="learning"
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
