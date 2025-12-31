import VATInvoiceForm from "@/components/tax/VATInvoiceForm";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function VATInvoicesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userOrgs } = await supabase
    .from("user_organizations")
    .select("organization_id, organizations(id, name)")
    .eq("user_id", user.id);

  const org = userOrgs?.[0]?.organizations?.[0];

  // Fetch recent invoices
  const { data: invoices } = await supabase
    .from("vat_invoices")
    .select("*")
    .eq("organization_id", org?.id || "")
    .order("invoice_date", { ascending: false })
    .limit(10);

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div>
          {org ? (
            <VATInvoiceForm
              organizationId={org.id}
              onSuccess={() => window.location.reload()}
            />
          ) : (
            <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md">
              No organization found
            </div>
          )}
        </div>

        {/* Recent Invoices */}
        <div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Recent Invoices</h2>

            {invoices && invoices.length > 0 ? (
              <div className="space-y-3">
                {invoices.map((inv) => (
                  <div key={inv.id} className="p-3 border rounded-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{inv.invoice_number}</p>
                        <p className="text-sm text-gray-600">
                          {inv.customer_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {inv.invoice_date}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          ₦{Number(inv.total_amount).toLocaleString("en-NG")}
                        </p>
                        <p className="text-xs text-gray-600">
                          VAT: ₦{Number(inv.vat_amount).toLocaleString("en-NG")}
                        </p>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            inv.invoice_type === "OUTPUT"
                              ? "bg-green-100 text-green-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {inv.invoice_type}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No invoices yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
