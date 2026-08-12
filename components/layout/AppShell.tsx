"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Compass,
  GitPullRequest,
  Repeat,
  MessageCircle,
  Bell,
  User,
  Settings,
  LogOut,
  Search,
  Menu,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { fetchUserNotifications, subscribeToUserNotifications } from "@/lib/notifications/queries";
import { fetchUserConversations } from "@/lib/chat/queries";
import { getInitials, cn } from "@/lib/utils";
import { toast } from "sonner";

interface AppShellProps {
  children: React.ReactNode;
  userProfile?: {
    full_name: string;
    username: string;
    avatar_url: string | null;
    university?: string | null;
  } | null;
}

const NAV_ITEMS = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Discover", href: "/discover", icon: Compass },
  { name: "Requests", href: "/requests", icon: GitPullRequest },
  { name: "Exchanges", href: "/exchanges", icon: Repeat },
  { name: "Messages", href: "/messages", icon: MessageCircle },
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Profile", href: "/profile", icon: User },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function AppShell({ children, userProfile }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    async function loadCounters() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // Notifications count
          const notifs = await fetchUserNotifications(user.id);
          const unreadNotifs = notifs.filter((n) => !n.is_read).length;
          setUnreadNotifCount(unreadNotifs);

          // Messages count
          const convs = await fetchUserConversations(user.id);
          const totalUnreadMsgs = convs.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
          setUnreadMsgCount(totalUnreadMsgs);

          // Realtime Notifications Listener
          unsubscribe = subscribeToUserNotifications(user.id, (newNotif) => {
            setUnreadNotifCount((prev) => prev + 1);
            toast.info(newNotif.title, {
              description: newNotif.message,
            });
          });
        }
      } catch (err) {
        console.error("AppShell load counters error", err);
      }
    }

    loadCounters();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [pathname]);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      router.push("/login");
    } catch (error) {
      console.error("Logout error", error);
      router.push("/login");
    }
  };

  const displayName = userProfile?.full_name || "Student User";
  const displayUsername = userProfile?.username ? `@${userProfile.username}` : "@student";

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans">
      {/* Desktop Left Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card p-4 sticky top-0 h-screen z-30 justify-between">
        <div className="space-y-6">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 px-3 py-2">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-foreground tracking-tight block leading-none">
                SkillSwap
              </span>
              <span className="text-[11px] text-muted-foreground font-medium">
                Peer Skill Exchange
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname?.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1">{item.name}</span>
                  {item.href === "/messages" && unreadMsgCount > 0 && (
                    <Badge variant="destructive" className="h-4 px-1.5 text-[10px] rounded-full">
                      {unreadMsgCount}
                    </Badge>
                  )}
                  {item.href === "/notifications" && unreadNotifCount > 0 && (
                    <Badge variant="destructive" className="h-4 px-1.5 text-[10px] rounded-full">
                      {unreadNotifCount}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer User Card */}
        <div className="pt-4 border-t border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-muted transition-colors text-left focus:outline-none"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={userProfile?.avatar_url || ""} alt={displayName} />
                  <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate">{displayName}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{displayUsername}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/profile")}>
                <User className="h-4 w-4 mr-2" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <Settings className="h-4 w-4 mr-2" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Mobile Top Navigation & Header */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 h-16 border-b border-border bg-card/95 backdrop-blur px-4 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Mobile Sheet Trigger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-4">
                <div className="space-y-6">
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-2">
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <span className="font-bold text-base text-foreground">SkillSwap</span>
                  </Link>
                  <nav className="space-y-1">
                    {NAV_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-muted"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="flex-1">{item.name}</span>
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>

            {/* Global Search */}
            <div className="relative w-full max-w-sm hidden sm:block">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search skills, students, subjects..."
                className="pl-9 h-9 text-xs bg-muted/40 border-border focus:bg-background"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notification Bell */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => router.push("/notifications")}
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 text-muted-foreground" />
              {unreadNotifCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                  {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
                </span>
              )}
            </Button>

            {/* Mobile User Avatar Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="focus:outline-none">
                  <Avatar className="h-8 w-8 cursor-pointer border border-border">
                    <AvatarImage src={userProfile?.avatar_url || ""} alt={displayName} />
                    <AvatarFallback className="text-xs">{getInitials(displayName)}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>{displayName}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/profile")}>
                  <User className="h-4 w-4 mr-2" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/settings")}>
                  <Settings className="h-4 w-4 mr-2" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
