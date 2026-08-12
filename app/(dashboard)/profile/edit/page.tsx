"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, ProfileValues } from "@/lib/validations/profile";
import { SkillSelector, SelectedSkillItem } from "@/components/skills/SkillSelector";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EXPERIENCE_LEVELS, AVAILABILITY_OPTIONS } from "@/lib/constants/skills";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2, User, BookOpen, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function ProfileEditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [teachingSkills, setTeachingSkills] = useState<SelectedSkillItem[]>([]);
  const [learningSkills, setLearningSkills] = useState<SelectedSkillItem[]>([]);

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      username: "",
      university: "",
      degree: "",
      semester: "",
      location: "",
      bio: "",
      experienceLevel: "Intermediate",
      availability: "3-5 hours/week",
    },
  });

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          setUserId(user.id);
          const { data: profile }: { data: any } = await (supabase as any)
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (profile) {
            form.reset({
              fullName: profile.full_name || "",
              username: profile.username || "",
              university: profile.university || "",
              degree: profile.degree || "",
              semester: profile.semester || "",
              location: profile.location || "",
              bio: profile.bio || "",
              experienceLevel: profile.experience_level || "Intermediate",
              availability: profile.availability || "3-5 hours/week",
            });
            setAvatarUrl(profile.avatar_url);
          }

          // Fetch Teaching Skills
          const { data: teachData }: { data: any[] | null } = await (supabase as any)
            .from("user_teaching_skills")
            .select("*, skill:skills(*)")
            .eq("user_id", user.id);

          if (teachData) {
            setTeachingSkills(
              teachData.map((t: any) => ({
                skillId: t.skill_id,
                name: t.skill?.name || "Skill",
                category: t.skill?.category || "General",
                level: t.experience_level,
              }))
            );
          }

          // Fetch Learning Skills
          const { data: learnData }: { data: any[] | null } = await (supabase as any)
            .from("user_learning_skills")
            .select("*, skill:skills(*)")
            .eq("user_id", user.id);

          if (learnData) {
            setLearningSkills(
              learnData.map((l: any) => ({
                skillId: l.skill_id,
                name: l.skill?.name || "Skill",
                category: l.skill?.category || "General",
                level: l.desired_level,
              }))
            );
          }
        }
      } catch (err) {
        console.error("Profile load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [form]);

  const onSubmit = async (values: ProfileValues) => {
    setIsSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = user?.id || userId;

      if (!targetUserId) {
        toast.success("Profile saved!");
        router.push("/profile");
        return;
      }

      // Update Profile table
      const { error: profileError } = await (supabase as any).from("profiles").upsert({
        id: targetUserId,
        full_name: values.fullName,
        username: values.username,
        avatar_url: avatarUrl,
        university: values.university,
        degree: values.degree,
        semester: values.semester,
        location: values.location,
        bio: values.bio || "",
        experience_level: values.experienceLevel,
        availability: values.availability,
        profile_visibility: "public",
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      });

      if (profileError) {
        console.error("Profile save error", profileError);
        toast.error(profileError.message || "Unable to save profile. Please check your data.");
        setIsSaving(false);
        return;
      }

      // Update Teaching Skills
      await (supabase as any).from("user_teaching_skills").delete().eq("user_id", targetUserId);
      if (teachingSkills.length > 0) {
        const teachingInserts = teachingSkills.map((item) => ({
          user_id: targetUserId,
          skill_id: item.skillId,
          experience_level: item.level,
        }));
        await (supabase as any).from("user_teaching_skills").insert(teachingInserts as any);
      }

      // Update Learning Skills
      await (supabase as any).from("user_learning_skills").delete().eq("user_id", targetUserId);
      if (learningSkills.length > 0) {
        const learningInserts = learningSkills.map((item) => ({
          user_id: targetUserId,
          skill_id: item.skillId,
          desired_level: item.level,
        }));
        await (supabase as any).from("user_learning_skills").insert(learningInserts as any);
      }

      toast.success("Profile updated successfully!");
      router.refresh();
      router.push("/profile");
    } catch (err: any) {
      console.error("Profile save error:", err);
      toast.error(err.message || "Unable to save your profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto py-6">
        <div className="h-8 w-40 bg-muted animate-pulse rounded" />
        <div className="h-64 w-full bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto font-sans animate-in fade-in-50 duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/profile">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Edit Profile</h1>
            <p className="text-xs text-muted-foreground">
              Update your personal details, background, and exchange skills
            </p>
          </div>
        </div>

        <Button onClick={form.handleSubmit(onSubmit)} disabled={isSaving} variant="emerald">
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" /> Save Changes
            </>
          )}
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="general" className="text-xs flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> Basic Info
              </TabsTrigger>
              <TabsTrigger value="teaching" className="text-xs flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" /> Teaching Skills
              </TabsTrigger>
              <TabsTrigger value="learning" className="text-xs flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" /> Learning Goals
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: General Info */}
            <TabsContent value="general">
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Personal & Academic Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <AvatarUpload
                    currentAvatarUrl={avatarUrl}
                    fullName={form.getValues("fullName") || "Student"}
                    userId={userId || undefined}
                    onAvatarChange={(url) => setAvatarUrl(url)}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Alex Morgan" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="alex_m" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="university"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>University / School</FormLabel>
                        <FormControl>
                          <Input placeholder="Stanford University" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="degree"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>Degree / Major</FormLabel>
                          <FormControl>
                            <Input placeholder="B.S. Computer Science" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="semester"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Semester / Year</FormLabel>
                          <FormControl>
                            <Input placeholder="3rd Year / Sem 6" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="San Francisco, CA or Online" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <textarea
                            rows={3}
                            className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            placeholder="Write a brief bio..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="experienceLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Overall Experience Level</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {EXPERIENCE_LEVELS.map((lvl) => (
                                <SelectItem key={lvl} value={lvl}>
                                  {lvl}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="availability"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weekly Availability</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select availability" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {AVAILABILITY_OPTIONS.map((opt) => (
                                <SelectItem key={opt} value={opt}>
                                  {opt}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2: Teaching Skills */}
            <TabsContent value="teaching">
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base text-emerald-700 dark:text-emerald-400">
                    Teaching & Mentoring Skills
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SkillSelector
                    type="teaching"
                    selectedSkills={teachingSkills}
                    onChange={setTeachingSkills}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 3: Learning Skills */}
            <TabsContent value="learning">
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base text-indigo-700 dark:text-indigo-400">
                    Learning Goals & Target Skills
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SkillSelector
                    type="learning"
                    selectedSkills={learningSkills}
                    onChange={setLearningSkills}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </Form>
    </div>
  );
}
