import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let profile = null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data } = await (supabase as any)
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (data) {
        profile = data;
      } else {
        const metaName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
        const emailHandle = user.email?.split("@")[0] || "user";
        profile = {
          id: user.id,
          full_name: metaName,
          username: emailHandle,
          avatar_url: user.user_metadata?.avatar_url || null,
        };
      }
    }
  } catch (err) {
    console.error("Dashboard layout auth check:", err);
  }

  return <AppShell userProfile={profile}>{children}</AppShell>;
}
