"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DiscoverFilters } from "@/lib/discover/types";
import { SKILL_CATEGORIES, EXPERIENCE_LEVELS, AVAILABILITY_OPTIONS, INITIAL_SKILLS, SeedSkill } from "@/lib/constants/skills";
import { fetchDatabaseSkills, fetchSkillCategories } from "@/lib/skills/queries";
import { fetchDistinctUniversities } from "@/lib/profiles/queries";
import { SlidersHorizontal, RotateCcw, Filter, Sparkles, GraduationCap } from "lucide-react";

interface FilterSidebarProps {
  filters: DiscoverFilters;
  onFilterChange: (updated: Partial<DiscoverFilters>) => void;
  onReset: () => void;
}

export function FilterSidebar({
  filters,
  onFilterChange,
  onReset,
}: FilterSidebarProps) {
  const [dbSkills, setDbSkills] = useState<SeedSkill[]>(INITIAL_SKILLS);
  const [categories, setCategories] = useState<string[]>([...SKILL_CATEGORIES]);
  const [universities, setUniversities] = useState<string[]>([]);

  useEffect(() => {
    async function loadFilterOptions() {
      const fetchedSkills = await fetchDatabaseSkills();
      if (fetchedSkills && fetchedSkills.length > 0) setDbSkills(fetchedSkills);

      const fetchedCats = await fetchSkillCategories();
      if (fetchedCats && fetchedCats.length > 0) setCategories(fetchedCats);

      const fetchedUnis = await fetchDistinctUniversities();
      if (fetchedUnis) setUniversities(fetchedUnis);
    }
    loadFilterOptions();
  }, []);

  const MATCH_SCORE_OPTIONS = [
    { label: "All Scores", value: 0 },
    { label: "50%+ Match", value: 50 },
    { label: "70%+ Match", value: 70 },
    { label: "80%+ High Match", value: 80 },
    { label: "90%+ Top Match", value: 90 },
  ];

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" /> Filter Students
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="h-7 text-xs text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-3 w-3 mr-1" /> Clear All
        </Button>
      </div>

      {/* 1. Skill Category Filter */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-foreground">Skill Category</Label>
        <Select
          value={filters.category || "all"}
          onValueChange={(val) => onFilterChange({ category: val, page: 1 })}
        >
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat} className="text-xs">
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 2. Specific Skill Selection */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-foreground">Specific Skill</Label>
        <Select
          value={filters.skills?.[0] || "all"}
          onValueChange={(val) =>
            onFilterChange({
              skills: val === "all" ? [] : [val],
              page: 1,
            })
          }
        >
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="Select specific skill" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All Skills</SelectItem>
            {dbSkills.map((skill) => (
              <SelectItem key={skill.id} value={skill.name} className="text-xs">
                {skill.name} ({skill.category})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 3. Minimum Match Score Filter */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
          <Sparkles className="h-3.5 w-3.5 text-violet-600" /> Minimum Match Score
        </Label>
        <div className="grid grid-cols-2 gap-1.5">
          {MATCH_SCORE_OPTIONS.map((opt) => {
            const isSelected = (filters.minMatchScore || 0) === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onFilterChange({ minMatchScore: opt.value, page: 1 })}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border text-left transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
                    : "bg-card text-muted-foreground border-border hover:border-primary/50"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Experience Level Filter */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-foreground">Experience Level</Label>
        <Select
          value={filters.experienceLevel || "all"}
          onValueChange={(val) => onFilterChange({ experienceLevel: val, page: 1 })}
        >
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="All Experience Levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All Experience Levels</SelectItem>
            {EXPERIENCE_LEVELS.map((lvl) => (
              <SelectItem key={lvl} value={lvl} className="text-xs">
                {lvl}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 5. University Filter */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
          <GraduationCap className="h-3.5 w-3.5 text-primary" /> University
        </Label>
        <Select
          value={filters.university || "all"}
          onValueChange={(val) => onFilterChange({ university: val, page: 1 })}
        >
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="All Universities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All Universities</SelectItem>
            {universities.map((uni) => (
              <SelectItem key={uni} value={uni} className="text-xs">
                {uni}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 6. Availability Filter */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-foreground">Weekly Availability</Label>
        <Select
          value={filters.availability || "all"}
          onValueChange={(val) => onFilterChange({ availability: val, page: 1 })}
        >
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="All Schedules" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All Schedules</SelectItem>
            {AVAILABILITY_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt} className="text-xs">
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
