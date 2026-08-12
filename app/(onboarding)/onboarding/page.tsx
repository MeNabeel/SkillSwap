"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, ProfileValues } from "@/lib/validations/profile";
import { SkillSelector, SelectedSkillItem } from "@/components/skills/SkillSelector";
import { SkillBadge } from "@/components/skills/SkillBadge";
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
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { EXPERIENCE_LEVELS, AVAILABILITY_OPTIONS } from "@/lib/constants/skills";
import {
  User,
  GraduationCap,
  Sparkles,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  MapPin,
  Clock,
  Briefcase,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [teachingSkills, setTeachingSkills] = useState<SelectedSkillItem[]>([]);
  const [learningSkills, setLearningSkills] = useState<SelectedSkillItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    async function loadUser() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          const fullName = user.user_metadata?.full_name || "";
          if (fullName) {
            form.setValue("fullName", fullName);
            const baseUsername = fullName
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "")
              .slice(0, 12);
            form.setValue("username", `${baseUsername}_${Math.floor(100 + Math.random() * 900)}`);
          }
        }
      } catch (err) {
        console.error("User load error:", err);
      }
    }
    loadUser();
  }, [form]);

  const handleNextStep = async () => {
    if (currentStep === 1) {
      const isValid = await form.trigger([
        "fullName",
        "username",
        "university",
        "degree",
        "semester",
        "location",
      ]);
      if (!isValid) return;
    } else if (currentStep === 2) {
      const isValid = await form.trigger(["experienceLevel", "availability"]);
      if (!isValid) return;
    } else if (currentStep === 3) {
      if (teachingSkills.length === 0) {
        toast.error("Please select at least 1 skill you can teach to proceed.");
        return;
      }
    } else if (currentStep === 4) {
      if (learningSkills.length === 0) {
        toast.error("Please select at least 1 skill you want to learn to proceed.");
        return;
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, 5));
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleCompleteProfile = async () => {
    setIsSubmitting(true);
    try {
      const values = form.getValues();
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = user?.id || userId;

      if (!targetUserId) {
        // Fallback for local demo preview if unauthenticated
        toast.success("Profile onboarding completed!");
        router.push("/dashboard");
        return;
      }

      // 1. Update Profile
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
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      });

      if (profileError) {
        console.error("Profile save error", profileError);
        toast.error("Unable to save profile. Please check your data.");
        setIsSubmitting(false);
        return;
      }

      // 2. Insert Teaching Skills
      if (teachingSkills.length > 0) {
        // Clear existing & insert
        await (supabase as any).from("user_teaching_skills").delete().eq("user_id", targetUserId);

        const teachingInserts = teachingSkills.map((item) => ({
          user_id: targetUserId,
          skill_id: item.skillId,
          experience_level: item.level,
        }));
        await (supabase as any).from("user_teaching_skills").insert(teachingInserts as any);
      }

      // 3. Insert Learning Skills
      if (learningSkills.length > 0) {
        await (supabase as any).from("user_learning_skills").delete().eq("user_id", targetUserId);

        const learningInserts = learningSkills.map((item) => ({
          user_id: targetUserId,
          skill_id: item.skillId,
          desired_level: item.level,
        }));
        await (supabase as any).from("user_learning_skills").insert(learningInserts as any);
      }

      toast.success("Congratulations! Your SkillSwap profile is ready.");
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      toast.error("Unable to complete profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formValues = form.getValues();
  const progressPercent = (currentStep / 5) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-md">
              <Sparkles className="h-6 w-6" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-foreground">
              SkillSwap
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Complete Your Student Profile
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Step {currentStep} of 5 —{" "}
            {currentStep === 1 && "Basic Information"}
            {currentStep === 2 && "About You & Availability"}
            {currentStep === 3 && "Skills You Teach"}
            {currentStep === 4 && "Skills You Want to Learn"}
            {currentStep === 5 && "Profile Preview"}
          </p>
          <div className="mt-4 max-w-xs mx-auto">
            <Progress value={progressPercent} className="h-2" />
          </div>
        </div>

        {/* Card Form */}
        <Card className="shadow-lg border-border">
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                {/* STEP 1: Basic Info */}
                {currentStep === 1 && (
                  <div className="space-y-4 animate-in fade-in-50 duration-300">
                    <div className="border-b border-border pb-3 mb-4">
                      <AvatarUpload
                        currentAvatarUrl={avatarUrl}
                        fullName={formValues.fullName || "Student"}
                        userId={userId || undefined}
                        onAvatarChange={(url) => setAvatarUrl(url)}
                      />
                    </div>

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
                              <div className="relative">
                                <span className="absolute left-3 top-2.5 text-xs text-muted-foreground">@</span>
                                <Input className="pl-7" placeholder="alex_m" {...field} />
                              </div>
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
                          <FormLabel>University / Institution</FormLabel>
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
                          <FormLabel>Location / Campus</FormLabel>
                          <FormControl>
                            <Input placeholder="San Francisco, CA or Online" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* STEP 2: About You */}
                {currentStep === 2 && (
                  <div className="space-y-4 animate-in fade-in-50 duration-300">
                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio / Introduction</FormLabel>
                          <FormControl>
                            <textarea
                              rows={4}
                              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                              placeholder="Tell fellow students about your academic interests, project goals, and what motivates you to swap skills..."
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>Max 500 characters.</FormDescription>
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
                            <FormLabel>Overall Student Experience</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select experience" />
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
                  </div>
                )}

                {/* STEP 3: Skills You Teach */}
                {currentStep === 3 && (
                  <div className="animate-in fade-in-50 duration-300">
                    <SkillSelector
                      type="teaching"
                      selectedSkills={teachingSkills}
                      onChange={setTeachingSkills}
                      title="Skills You Can Teach or Share"
                      description="Select the subjects, frameworks, or languages you feel confident helping other students with."
                    />
                  </div>
                )}

                {/* STEP 4: Skills You Want to Learn */}
                {currentStep === 4 && (
                  <div className="animate-in fade-in-50 duration-300">
                    <SkillSelector
                      type="learning"
                      selectedSkills={learningSkills}
                      onChange={setLearningSkills}
                      title="Skills You Want to Learn"
                      description="Select the subjects or technologies you want to master through peer skill exchanges."
                    />
                  </div>
                )}

                {/* STEP 5: Profile Preview */}
                {currentStep === 5 && (
                  <div className="space-y-6 animate-in fade-in-50 duration-300">
                    <div className="p-4 rounded-xl bg-muted/30 border border-border flex items-start gap-4">
                      <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl overflow-hidden shrink-0 border border-border">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                        ) : (
                          formValues.fullName?.slice(0, 2).toUpperCase() || "SS"
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-foreground truncate">
                            {formValues.fullName}
                          </h3>
                          <Badge variant="outline" className="text-xs font-normal">
                            @{formValues.username}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <GraduationCap className="h-3.5 w-3.5" />
                          {formValues.degree} • {formValues.university} ({formValues.semester})
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3.5 w-3.5" />
                          {formValues.location}
                        </p>
                      </div>
                    </div>

                    {formValues.bio && (
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                          Bio
                        </h4>
                        <p className="text-sm text-foreground bg-card p-3 rounded-lg border border-border">
                          {formValues.bio}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Teaching Skills ({teachingSkills.length})
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {teachingSkills.map((s) => (
                            <SkillBadge
                              key={s.skillId}
                              name={s.name}
                              category={s.category}
                              level={s.level}
                              type="teaching"
                            />
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5" /> Learning Goals ({learningSkills.length})
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {learningSkills.map((s) => (
                            <SkillBadge
                              key={s.skillId}
                              name={s.name}
                              category={s.category}
                              level={s.level}
                              type="learning"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </Form>
          </CardContent>

          {/* Card Navigation Footer */}
          <CardFooter className="flex items-center justify-between border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevStep}
              disabled={currentStep === 1 || isSubmitting}
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>

            {currentStep < 5 ? (
              <Button type="button" onClick={handleNextStep}>
                Next Step <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="emerald"
                disabled={isSubmitting}
                onClick={handleCompleteProfile}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving Profile...
                  </>
                ) : (
                  <>
                    Complete Profile <CheckCircle2 className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
