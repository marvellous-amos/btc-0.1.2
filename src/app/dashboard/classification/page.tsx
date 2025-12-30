import ClassificationForm from "@/src/components/tax/classificationForm";
import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ClassificationPage() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get user's organizations
  const { data: userOrgs } = await supabase
    .from("user_organizations")
    .select("organization_id, organizations(id, name, entity_classification)")
    .eq("user_id", user.id);

  const org = userOrgs?.[0]?.organizations?.[0];

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Entity Classification
        </h1>
        <p className="text-gray-600 mt-2">
          Determine if your company qualifies as SMALL or STANDARD under Nigeria
          Tax Act 2024
        </p>
      </div>

      {org && (
        <div className="mb-6 p-4 bg-blue-50 rounded-md">
          <p className="text-sm font-medium">Organization: {org.name}</p>
          {org.entity_classification && (
            <p className="text-sm text-gray-600">
              Current Classification:{" "}
              <span className="font-semibold">{org.entity_classification}</span>
            </p>
          )}
        </div>
      )}

      {org ? (
        <ClassificationForm
          organizationId={org.id}
          onSuccess={() => window.location.reload()}
        />
      ) : (
        <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md">
          No organization found. Please create an organization first.
        </div>
      )}
    </div>
  );
}
