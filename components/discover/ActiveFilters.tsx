"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DiscoverFilters } from "@/lib/discover/types";
import { X, RotateCcw } from "lucide-react";

interface ActiveFiltersProps {
  filters: DiscoverFilters;
  onRemoveFilter: (key: keyof DiscoverFilters, value?: any) => void;
  onClearAll: () => void;
}

export function ActiveFilters({
  filters,
  onRemoveFilter,
  onClearAll,
}: ActiveFiltersProps) {
  const activeItems: { label: string; key: keyof DiscoverFilters; val?: any }[] = [];

  if (filters.query?.trim()) {
    activeItems.push({ label: `Search: "${filters.query}"`, key: "query" });
  }

  if (filters.category && filters.category !== "all") {
    activeItems.push({ label: `Category: ${filters.category}`, key: "category" });
  }

  if (filters.skills && filters.skills.length > 0) {
    filters.skills.forEach((s) => {
      activeItems.push({ label: `Skill: ${s}`, key: "skills", val: s });
    });
  }

  if (filters.experienceLevel && filters.experienceLevel !== "all") {
    activeItems.push({ label: `Level: ${filters.experienceLevel}`, key: "experienceLevel" });
  }

  if (filters.university && filters.university !== "all") {
    activeItems.push({ label: `Uni: ${filters.university}`, key: "university" });
  }

  if (filters.availability && filters.availability !== "all") {
    activeItems.push({ label: `Schedule: ${filters.availability}`, key: "availability" });
  }

  if (filters.minMatchScore && filters.minMatchScore > 0) {
    activeItems.push({ label: `${filters.minMatchScore}%+ Match`, key: "minMatchScore" });
  }

  if (activeItems.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 py-2 font-sans text-xs">
      <span className="font-semibold text-muted-foreground">Active Filters:</span>
      {activeItems.map((item, idx) => (
        <Badge
          key={`${item.key}-${idx}`}
          variant="outline"
          className="bg-card text-foreground border-border px-2.5 py-1 flex items-center gap-1.5 font-medium shadow-xs"
        >
          <span>{item.label}</span>
          <button
            type="button"
            onClick={() => onRemoveFilter(item.key, item.val)}
            className="text-muted-foreground hover:text-destructive focus:outline-none"
            aria-label={`Remove filter ${item.label}`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 px-2"
      >
        <RotateCcw className="h-3 w-3 mr-1" /> Clear All
      </Button>
    </div>
  );
}
