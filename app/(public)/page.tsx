import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background font-sans flex flex-col justify-between">
      {/* Header Bar */}
      <header className="border-b border-border bg-card/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Top Left Corner: Logo image from public/logo.png */}
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/logo.png"
              alt="SkillSwap Logo"
              width={40}
              height={40}
              className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
              priority
            />
            <span className="font-extrabold text-xl tracking-tight text-foreground">
              SkillSwap
            </span>
          </Link>

          {/* Top Right Corner: Sign In and Sign Up */}
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="font-semibold text-xs">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs border-none">
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold shadow-xs">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            Peer-to-Peer Student Skill Exchange Platform
          </div>

          {/* Main Title: Learn Together. Teach Together. Connect Through Skills in distinct lines & color combo */}
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight">
            <span className="block text-foreground mb-2">Learn Together. Teach Together.</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-700 to-amber-600">
              Connect Through Skills.
            </span>
          </h1>

          {/* Subheading: Distinct readable sizing */}
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed font-normal">
            SkillSwap empowers university students to exchange knowledge democratically without financial barriers. Trade your programming, design, or language skills for peer mentorship.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button asChild size="lg" className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-md text-sm">
              <Link href="/signup">
                Create Free Account <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto text-sm font-medium">
              <Link href="/login">Explore Platform</Link>
            </Button>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 text-left">
            <Card className="card-hover border-border">
              <CardContent className="pt-6 space-y-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-700">
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
                <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600">
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
                <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-700">
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

      {/* Footer: Using logo.png, removing Signin/Signup from footer */}
      <footer className="border-t border-border bg-card py-8 px-4 text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="SkillSwap Logo"
              width={28}
              height={28}
              className="h-7 w-auto object-contain"
            />
            <span className="font-bold text-foreground">SkillSwap</span>
            <span>© 2026 — Peer Skill Exchange Network</span>
          </div>

          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="hover:text-foreground cursor-pointer">Terms of Service</span>
            <span className="hover:text-foreground cursor-pointer">Privacy Policy</span>
            <span className="hover:text-foreground cursor-pointer">Contact Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
