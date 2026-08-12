import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Users,
  ShieldCheck,
  Zap,
  GraduationCap,
  Search,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background font-sans flex flex-col justify-between">
      {/* Header Bar */}
      <header className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-foreground">
              SkillSwap
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-semibold shadow-xs">
            <Sparkles className="h-4 w-4 text-violet-600" />
            Peer-to-Peer Student Skill Exchange Platform
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto leading-tight">
            Learn Together. Teach Together. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-600 to-violet-600">
              Connect Through Skills.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            SkillSwap empowers university students to exchange knowledge democratically without financial barriers. Trade your programming, design, or language skills for peer mentorship.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button asChild size="lg" className="w-full sm:w-auto font-semibold shadow-md">
              <Link href="/signup">
                Create Free Account <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link href="/login">Explore Platform</Link>
            </Button>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 text-left">
            <Card className="card-hover border-border">
              <CardContent className="pt-6 space-y-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Teach What You Know</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Share your expertise in React, Data Structures, Figma, Calculus, or Spanish with peers who need guidance.
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover border-border">
              <CardContent className="pt-6 space-y-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-primary">
                  <BookOpen className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Learn What You Need</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Master new programming languages, design tools, or academic subjects through 1-on-1 peer learning sessions.
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover border-border">
              <CardContent className="pt-6 space-y-3">
                <div className="h-10 w-10 rounded-xl bg-violet-50 dark:bg-violet-950/50 flex items-center justify-center text-violet-600">
                  <Users className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Verified Student Community</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Connect securely with verified university students. Build your academic network while levelling up skills.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8 px-4 text-center text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">SkillSwap</span>
            <span>© 2026 — Peer Skill Exchange Network</span>
          </div>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-foreground">Login</Link>
            <Link href="/signup" className="hover:text-foreground">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
