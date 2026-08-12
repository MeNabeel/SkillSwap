"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { X, Code, Palette, Brain, Database, Calculator, BookOpen, Languages, Globe, Mic, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface SkillBadgeProps {
  name: string;
  category?: string;
  level?: string;
  type: "teaching" | "learning";
  onRemove?: () => void;
  onClick?: () => void;
  className?: string;
}

export function SkillBadge({
  name,
  category,
  level,
  type,
  onRemove,
  onClick,
  className,
}: SkillBadgeProps) {
  const isTeaching = type === "teaching";

  const getCategoryIcon = (cat?: string) => {
    if (!cat) return <Code className="h-3.5 w-3.5 mr-1" />;
    switch (cat.toLowerCase()) {
      case "design & creative":
        return <Palette className="h-3.5 w-3.5 mr-1" />;
      case "data & ai":
        return <Brain className="h-3.5 w-3.5 mr-1" />;
      case "academics & science":
        return <BookOpen className="h-3.5 w-3.5 mr-1" />;
      case "languages":
        return <Languages className="h-3.5 w-3.5 mr-1" />;
      case "business & career":
        return <TrendingUp className="h-3.5 w-3.5 mr-1" />;
      default:
        return <Code className="h-3.5 w-3.5 mr-1" />;
    }
  };

  return (
    <Badge
      variant={isTeaching ? "teaching" : "learning"}
      className={cn(
        "inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-all shadow-none cursor-default",
        onClick && "cursor-pointer hover:opacity-90",
        className
      )}
      onClick={onClick}
    >
      {getCategoryIcon(category)}
      <span>{name}</span>
      {level && (
        <span
          className={cn(
            "ml-1 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full",
            isTeaching
              ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200"
              : "bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200"
          )}
        >
          {level}
        </span>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 text-muted-foreground hover:text-destructive transition-colors focus:outline-none"
          aria-label={`Remove ${name}`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </Badge>
  );
}
