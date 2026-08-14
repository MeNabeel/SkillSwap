import React from "react";
import Link from "next/link";
import Image from "next/image";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-3 mb-4 group">
          <Image
            src="/logo.png"
            alt="SkillSwap Logo"
            width={44}
            height={44}
            className="h-11 w-auto object-contain transition-transform group-hover:scale-105"
            priority
          />
          <span className="font-bold text-2xl tracking-tight text-foreground">
            SkillSwap
          </span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow-md sm:rounded-2xl sm:px-10 border border-border">
          {children}
        </div>
      </div>
    </div>
  );
}
