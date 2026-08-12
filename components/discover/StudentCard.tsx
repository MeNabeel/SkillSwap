"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SkillBadge } from "@/components/skills/SkillBadge";
import { StudentCardData } from "@/lib/discover/types";
import { getInitials } from "@/lib/utils";
import {
  GraduationCap,
  Sparkles,
  Star,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  UserPlus,
  Repeat,
  Briefcase,
} from "lucide-react";

interface StudentCardProps {
  student: StudentCardData;
}

export function StudentCard({ student }: StudentCardProps) {
  const matchScore = student.matchScore || 75;

  // Match score color badge variant per DESIGN.md
  const getMatchBadgeVariant = (score: number) => {
    if (score >= 80) return "teaching"; // Emerald tint
    if (score >= 65) return "learning"; // Indigo tint
    return "violet"; // Soft Violet tint
  };

  return (
    <Card className="card-hover border-border flex flex-col justify-between h-full bg-card overflow-hidden">
      <div>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="h-11 w-11 border border-border shrink-0">
                <AvatarImage src={student.avatar_url || ""} alt={student.full_name} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                  {getInitials(student.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <CardTitle className="text-base truncate hover:text-primary transition-colors">
                  <Link href={`/students/${student.id}`}>{student.full_name}</Link>
                </CardTitle>
                <CardDescription className="text-xs truncate font-medium">
                  @{student.username}
                </CardDescription>
              </div>
            </div>

            {/* Match Score Badge */}
            <Badge
              variant={getMatchBadgeVariant(matchScore)}
              className="text-[11px] font-bold px-2 py-0.5 shrink-0 flex items-center gap-1 shadow-2xs"
            >
              <Sparkles className="h-3 w-3" />
              <span>{matchScore}% Match</span>
            </Badge>
          </div>

          <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5 truncate">
            <GraduationCap className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="truncate">
              {student.university || "University N/A"}
              {student.degree ? ` • ${student.degree}` : ""}
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-3.5 text-xs">
          {/* Bio Snippet */}
          {student.bio && (
            <p className="text-muted-foreground line-clamp-2 leading-relaxed text-[13px]">
              "{student.bio}"
            </p>
          )}

          {/* Rating & Exchange stats */}
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground bg-muted/40 p-2 rounded-lg border border-border/50">
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              <span className="font-semibold text-foreground">
                {student.rating ? student.rating.toFixed(1) : "New to SkillSwap"}
              </span>
              {student.rating_count ? ` (${student.rating_count})` : ""}
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Repeat className="h-3.5 w-3.5 text-primary" />
              <span>{student.completed_exchanges || 0} exchanges</span>
            </div>
          </div>

          {/* Teaching Skills */}
          <div>
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Can Teach:
            </span>
            <div className="flex flex-wrap gap-1 max-h-[64px] overflow-hidden">
              {student.teaching_skills.slice(0, 3).map((s) => (
                <SkillBadge
                  key={s.skillId}
                  name={s.name}
                  category={s.category}
                  level={s.level}
                  type="teaching"
                />
              ))}
              {student.teaching_skills.length > 3 && (
                <span className="text-[10px] text-muted-foreground self-center px-1 font-medium">
                  +{student.teaching_skills.length - 3} more
                </span>
              )}
            </div>
          </div>

          {/* Learning Skills */}
          <div>
            <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
              <BookOpen className="h-3 w-3" /> Wants to Learn:
            </span>
            <div className="flex flex-wrap gap-1 max-h-[64px] overflow-hidden">
              {student.learning_skills.slice(0, 3).map((s) => (
                <SkillBadge
                  key={s.skillId}
                  name={s.name}
                  category={s.category}
                  level={s.level}
                  type="learning"
                />
              ))}
              {student.learning_skills.length > 3 && (
                <span className="text-[10px] text-muted-foreground self-center px-1 font-medium">
                  +{student.learning_skills.length - 3} more
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </div>

      <CardFooter className="pt-3 border-t border-border mt-2">
        <Button asChild size="sm" variant="outline" className="w-full text-xs justify-between group">
          <Link href={`/students/${student.id}`}>
            <span>View Profile & Match</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
