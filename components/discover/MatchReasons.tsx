"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CheckCircle2, Sparkles } from "lucide-react";

interface MatchReasonsProps {
  reasons: string[];
  matchScore: number;
}

export function MatchReasons({ reasons, matchScore }: MatchReasonsProps) {
  return (
    <Card className="border-border bg-gradient-to-br from-indigo-50/40 via-card to-emerald-50/40 dark:from-indigo-950/20 dark:via-card dark:to-emerald-950/20 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
            <Sparkles className="h-4 w-4 text-violet-600" /> Why You Match
          </CardTitle>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            {matchScore}% Compatibility
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-xs">
          {reasons.map((reason, idx) => (
            <li key={idx} className="flex items-start gap-2 text-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="leading-normal font-medium">{reason}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
