import type React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardHeader } from "@/components/dashboard/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Check if user has an organization, if not, they might need onboarding
  const { data: userOrg } = await supabase
    .from("user_organizations")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (!userOrg && !children?.toString().includes("onboarding")) {
    // We'll create a simple onboarding redirect later if needed
    // For now, let's allow them to see a "Create Organization" state
  }

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <DashboardHeader user={user} />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
