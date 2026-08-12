"use client";

import React, { useState, useEffect, useTransition, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StudentCard } from "@/components/discover/StudentCard";
import { FilterSidebar } from "@/components/discover/FilterSidebar";
import { ActiveFilters } from "@/components/discover/ActiveFilters";
import { PaginationControls } from "@/components/discover/PaginationControls";
import { fetchDiscoverStudents } from "@/lib/discover/queries";
import { DiscoverFilters, PaginatedDiscoverResult } from "@/lib/discover/types";
import { createClient } from "@/lib/supabase/client";
import { Search, SlidersHorizontal, Users, Sparkles, RotateCcw, Loader2 } from "lucide-react";

function DiscoverContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read URL search params initial state
  const initialFilters: DiscoverFilters = {
    query: searchParams.get("q") || "",
    category: searchParams.get("category") || "all",
    skills: searchParams.get("skills") ? searchParams.get("skills")!.split(",") : [],
    experienceLevel: searchParams.get("experience") || "all",
    university: searchParams.get("university") || "all",
    availability: searchParams.get("availability") || "all",
    minMatchScore: searchParams.get("minMatch") ? parseInt(searchParams.get("minMatch")!, 10) : 0,
    sortBy: (searchParams.get("sortBy") as any) || "best_match",
    page: searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1,
    pageSize: 12,
  };

  const [filters, setFilters] = useState<DiscoverFilters>(initialFilters);
  const [searchInput, setSearchInput] = useState(initialFilters.query || "");
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<PaginatedDiscoverResult | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Debounced search input sync
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== filters.query) {
        updateFilters({ query: searchInput, page: 1 });
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchInput]);

  // Load Logged in User Profile for Match Calculation
  useEffect(() => {
    async function loadCurrentUser() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: p } = await (supabase as any)
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (p) {
            const { data: teachData } = await (supabase as any)
              .from("user_teaching_skills")
              .select("*, skill:skills(*)")
              .eq("user_id", user.id);

            const { data: learnData } = await (supabase as any)
              .from("user_learning_skills")
              .select("*, skill:skills(*)")
              .eq("user_id", user.id);

            setCurrentUserProfile({
              id: p.id,
              full_name: p.full_name,
              username: p.username,
              university: p.university,
              experience_level: p.experience_level,
              availability: p.availability,
              teaching_skills: (teachData || []).map((t: any) => ({
                skillId: t.skill_id,
                name: t.skill?.name || "Skill",
                category: t.skill?.category || "General",
                level: t.experience_level,
              })),
              learning_skills: (learnData || []).map((l: any) => ({
                skillId: l.skill_id,
                name: l.skill?.name || "Skill",
                category: l.skill?.category || "General",
                level: l.desired_level,
              })),
            });
          }
        }
      } catch (err) {
        console.error("Discover load user profile error", err);
      }
    }
    loadCurrentUser();
  }, []);

  // Sync state with Database queries
  useEffect(() => {
    async function executeQuery() {
      setIsLoading(true);
      const res = await fetchDiscoverStudents(filters, currentUserProfile);
      setResult(res);
      setIsLoading(false);
    }
    executeQuery();
  }, [filters, currentUserProfile]);

  // Update Filters & Sync URL Search Params
  const updateFilters = (updated: Partial<DiscoverFilters>) => {
    const nextFilters = { ...filters, ...updated };
    setFilters(nextFilters);

    // Update URL Search Parameters
    const params = new URLSearchParams();
    if (nextFilters.query?.trim()) params.set("q", nextFilters.query.trim());
    if (nextFilters.category && nextFilters.category !== "all") params.set("category", nextFilters.category);
    if (nextFilters.skills && nextFilters.skills.length > 0) params.set("skills", nextFilters.skills.join(","));
    if (nextFilters.experienceLevel && nextFilters.experienceLevel !== "all") params.set("experience", nextFilters.experienceLevel);
    if (nextFilters.university && nextFilters.university !== "all") params.set("university", nextFilters.university);
    if (nextFilters.availability && nextFilters.availability !== "all") params.set("availability", nextFilters.availability);
    if (nextFilters.minMatchScore && nextFilters.minMatchScore > 0) params.set("minMatch", nextFilters.minMatchScore.toString());
    if (nextFilters.sortBy && nextFilters.sortBy !== "best_match") params.set("sortBy", nextFilters.sortBy);
    if (nextFilters.page && nextFilters.page > 1) params.set("page", nextFilters.page.toString());

    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  };

  const handleResetFilters = () => {
    setSearchInput("");
    const defaultFilters: DiscoverFilters = {
      query: "",
      category: "all",
      skills: [],
      experienceLevel: "all",
      university: "all",
      availability: "all",
      minMatchScore: 0,
      sortBy: "best_match",
      page: 1,
      pageSize: 12,
    };
    setFilters(defaultFilters);
    router.replace(pathname, { scroll: false });
  };

  const handleRemoveSingleFilter = (key: keyof DiscoverFilters, val?: any) => {
    if (key === "query") {
      setSearchInput("");
      updateFilters({ query: "", page: 1 });
    } else if (key === "skills" && val) {
      const remaining = (filters.skills || []).filter((s) => s !== val);
      updateFilters({ skills: remaining, page: 1 });
    } else {
      updateFilters({ [key]: key === "minMatchScore" ? 0 : "all", page: 1 });
    }
  };

  return (
    <div className="space-y-6 font-sans animate-in fade-in-50 duration-300 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Discover Students
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Find students who can teach what you want to learn and learn what you can teach.
          </p>
        </div>

        {/* Sort & Mobile Filter Buttons */}
        <div className="flex items-center gap-2">
          {/* Mobile Filter Sheet Trigger */}
          <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="outline" size="sm" className="h-9 text-xs">
                <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" /> Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 overflow-y-auto">
              <SheetHeader className="pb-4 border-b border-border">
                <SheetTitle className="text-base flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-primary" /> Filter Options
                </SheetTitle>
              </SheetHeader>
              <div className="pt-4">
                <FilterSidebar
                  filters={filters}
                  onFilterChange={(updated) => {
                    updateFilters(updated);
                    setMobileFilterOpen(false);
                  }}
                  onReset={() => {
                    handleResetFilters();
                    setMobileFilterOpen(false);
                  }}
                />
              </div>
            </SheetContent>
          </Sheet>

          {/* Sort Dropdown */}
          <Select
            value={filters.sortBy || "best_match"}
            onValueChange={(val: any) => updateFilters({ sortBy: val, page: 1 })}
          >
            <SelectTrigger className="w-[170px] h-9 text-xs">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="best_match" className="text-xs">Best Match</SelectItem>
              <SelectItem value="highest_rated" className="text-xs">Highest Rated</SelectItem>
              <SelectItem value="most_experienced" className="text-xs">Most Experienced</SelectItem>
              <SelectItem value="recently_joined" className="text-xs">Recently Joined</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Search Input Bar */}
      <Card className="p-3 border-border shadow-xs">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by student name, username, university, or skill (e.g. React, Python, Stanford)..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10 h-10 text-sm border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
          />
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mr-3" />}
        </div>
      </Card>

      {/* Active Filter Pills Bar */}
      <ActiveFilters
        filters={filters}
        onRemoveFilter={handleRemoveSingleFilter}
        onClearAll={handleResetFilters}
      />

      {/* Main Discover Layout: Desktop Sidebar + Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Desktop Filter Sidebar */}
        <div className="hidden lg:block lg:col-span-1 border border-border rounded-xl p-5 bg-card shadow-xs sticky top-20">
          <FilterSidebar
            filters={filters}
            onFilterChange={updateFilters}
            onReset={handleResetFilters}
          />
        </div>

        {/* Student Cards Grid */}
        <div className="lg:col-span-3 space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-11 w-11 rounded-full" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </Card>
              ))}
            </div>
          ) : !result || result.students.length === 0 ? (
            /* Empty State */
            <Card className="p-12 text-center border-dashed border-border">
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="h-14 w-14 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground">
                  <Users className="h-7 w-7" />
                </div>
                <h3 className="text-base font-semibold text-foreground">No students found</h3>
                <p className="text-xs text-muted-foreground max-w-sm">
                  We couldn't find any students matching your search criteria or skill filters.
                </p>
                <Button variant="outline" size="sm" onClick={handleResetFilters} className="mt-2 text-xs">
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Clear Filters
                </Button>
              </div>
            </Card>
          ) : (
            <>
              {/* Results Count Header */}
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <span>
                  Showing {result.students.length} of {result.totalCount} student matches
                </span>
                <span>Page {result.currentPage} of {result.totalPages}</span>
              </div>

              {/* Grid List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {result.students.map((student) => (
                  <StudentCard key={student.id} student={student} />
                ))}
              </div>

              {/* Pagination Controls */}
              <PaginationControls
                currentPage={result.currentPage}
                totalPages={result.totalPages}
                onPageChange={(page) => updateFilters({ page })}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 space-y-4 max-w-7xl mx-auto">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <DiscoverContent />
    </Suspense>
  );
}
