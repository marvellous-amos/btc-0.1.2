import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Building2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if user has an organization
  const { data: userOrg } = await supabase
    .from("user_organizations")
    .select("*, organizations(*)")
    .eq("user_id", user?.id)
    .maybeSingle();

  if (!userOrg) {
    return (
      <div className="flex flex-col gap-6 items-center justify-center min-h-[60vh] text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/5">
          <Building2 className="h-10 w-10 text-primary" />
        </div>
        <div className="space-y-2 max-w-md">
          <h2 className="text-2xl font-bold">
            Welcome to Borderless Compliance
          </h2>
          <p className="text-muted-foreground">
            You haven&apos;t set up an organization yet. Create your SME profile
            to start managing your tax compliance.
          </p>
        </div>
        <Button asChild size="lg" className="h-12 px-8">
          <Link
            href="/dashboard/onboarding"
            className="flex items-center gap-2"
          >
            <PlusCircle className="h-5 w-5" />
            Create Organization
          </Link>
        </Button>
      </div>
    );
  }

  const org = userOrg.organizations;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome, {org.name}
        </h1>
        <p className="text-muted-foreground">
          Compliance Status:{" "}
          {org.entity_classification || "Pending Classification"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Invoices
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Ready for VAT computation
            </p>
          </CardContent>
        </Card>
        {/* Add more stats cards as needed */}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1 shadow-sm">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest compliance actions in your organization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 items-center justify-center py-8 text-center border-2 border-dashed rounded-lg">
              <p className="text-sm text-muted-foreground">
                No recent activity found.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
