"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SkillBadge } from "./SkillBadge";
import { INITIAL_SKILLS, EXPERIENCE_LEVELS, SKILL_CATEGORIES, SeedSkill } from "@/lib/constants/skills";
import { fetchDatabaseSkills, fetchSkillCategories } from "@/lib/skills/queries";
import { Search, Plus, Check, SlidersHorizontal, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

export interface SelectedSkillItem {
  skillId: string;
  name: string;
  category: string;
  level: "Beginner" | "Intermediate" | "Advanced" | "Expert";
}

interface SkillSelectorProps {
  type: "teaching" | "learning";
  selectedSkills: SelectedSkillItem[];
  onChange: (skills: SelectedSkillItem[]) => void;
  title?: string;
  description?: string;
}

export function SkillSelector({
  type,
  selectedSkills,
  onChange,
  title,
  description,
}: SkillSelectorProps) {
  const [dbSkills, setDbSkills] = useState<SeedSkill[]>(INITIAL_SKILLS);
  const [categories, setCategories] = useState<string[]>([...SKILL_CATEGORIES]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSkillForAdd, setSelectedSkillForAdd] = useState<SeedSkill | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<"Beginner" | "Intermediate" | "Advanced" | "Expert">("Intermediate");

  useEffect(() => {
    async function loadDynamicSkills() {
      const fetchedSkills = await fetchDatabaseSkills();
      if (fetchedSkills && fetchedSkills.length > 0) {
        setDbSkills(fetchedSkills);
      }
      const fetchedCats = await fetchSkillCategories();
      if (fetchedCats && fetchedCats.length > 0) {
        setCategories(fetchedCats);
      }
    }
    loadDynamicSkills();
  }, []);

  const isTeaching = type === "teaching";

  // Filter skills based on search query and category
  const filteredSkills = useMemo(() => {
    return dbSkills.filter((skill) => {
      const matchesSearch =
        skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        skill.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || skill.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [dbSkills, searchQuery, selectedCategory]);

  const selectedSkillIds = useMemo(
    () => new Set(selectedSkills.map((s) => s.skillId)),
    [selectedSkills]
  );

  const handleAddSkill = (skill: SeedSkill) => {
    if (selectedSkillIds.has(skill.id)) return;
    const newItem: SelectedSkillItem = {
      skillId: skill.id,
      name: skill.name,
      category: skill.category,
      level: selectedLevel,
    };
    onChange([...selectedSkills, newItem]);
    setSelectedSkillForAdd(null);
  };

  const handleRemoveSkill = (skillId: string) => {
    onChange(selectedSkills.filter((s) => s.skillId !== skillId));
  };

  const handleLevelChange = (skillId: string, level: "Beginner" | "Intermediate" | "Advanced" | "Expert") => {
    onChange(
      selectedSkills.map((s) =>
        s.skillId === skillId ? { ...s, level } : s
      )
    );
  };

  return (
    <div className="space-y-4">
      {(title || description) && (
        <div>
          {title && <h4 className="text-base font-semibold text-foreground">{title}</h4>}
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      {/* Selected Skills Badges List */}
      <div className="min-h-[60px] p-3 rounded-xl border border-dashed border-border bg-muted/30 flex flex-wrap gap-2 items-center">
        {selectedSkills.length === 0 ? (
          <div className="flex items-center text-xs text-muted-foreground justify-center w-full py-2 gap-1.5">
            <Sparkles className="h-4 w-4 text-muted-foreground/60" />
            <span>No {isTeaching ? "teaching" : "learning"} skills selected yet. Select skills from below.</span>
          </div>
        ) : (
          selectedSkills.map((item) => (
            <div key={item.skillId} className="flex items-center gap-1">
              <SkillBadge
                name={item.name}
                category={item.category}
                level={item.level}
                type={type}
                onRemove={() => handleRemoveSkill(item.skillId)}
              />
              <Select
                value={item.level}
                onValueChange={(val: any) => handleLevelChange(item.skillId, val)}
              >
                <SelectTrigger className="h-7 text-[11px] px-2 py-0 w-[110px] rounded-lg">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  {EXPERIENCE_LEVELS.map((lvl) => (
                    <SelectItem key={lvl} value={lvl} className="text-xs">
                      {lvl}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))
        )}
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search skills (e.g., React, Python, Design)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[200px] text-sm">
            <SlidersHorizontal className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat} className="text-xs">
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Level Selection Header for quick add */}
      <div className="flex items-center justify-between bg-card p-2 px-3 rounded-lg border border-border text-xs">
        <span className="text-muted-foreground">Default level for new selection:</span>
        <div className="flex items-center gap-2">
          <Select
            value={selectedLevel}
            onValueChange={(val: any) => setSelectedLevel(val)}
          >
            <SelectTrigger className="h-7 text-xs w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXPERIENCE_LEVELS.map((lvl) => (
                <SelectItem key={lvl} value={lvl} className="text-xs">
                  {lvl}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Skills Grid List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1">
        {filteredSkills.length === 0 ? (
          <div className="col-span-full py-6 text-center text-xs text-muted-foreground">
            No matching skills found. Try a different search.
          </div>
        ) : (
          filteredSkills.map((skill) => {
            const isSelected = selectedSkillIds.has(skill.id);
            return (
              <Card
                key={skill.id}
                className={`p-3 cursor-pointer flex items-center justify-between transition-all ${
                  isSelected
                    ? isTeaching
                      ? "bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800"
                      : "bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-800"
                    : "hover:bg-muted/50 border-border"
                }`}
                onClick={() => {
                  if (isSelected) {
                    handleRemoveSkill(skill.id);
                  } else {
                    handleAddSkill(skill);
                  }
                }}
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-foreground truncate">
                      {skill.name}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {skill.category}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={isSelected ? "ghost" : isTeaching ? "emerald" : "default"}
                  className="h-7 px-2 text-xs shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isSelected) {
                      handleRemoveSkill(skill.id);
                    } else {
                      handleAddSkill(skill);
                    }
                  }}
                >
                  {isSelected ? (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1" /> Selected
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add
                    </>
                  )}
                </Button>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
