/**
 * API ROUTE: /api/tax/vat/compute
 * Computes monthly VAT position
 *
 * FILE: src/app/api/tax/vat/compute/route.ts
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import { computeVATPosition } from "@/src/lib/tax/vat-computation";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request
    const body = await request.json();
    const { organizationId, periodStart, periodEnd, taxPeriodId } = body;

    if (!organizationId || !periodStart || !periodEnd) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Authorization
    const { data: userOrg } = await supabase
      .from("user_organizations")
      .select("role")
      .eq("user_id", user.id)
      .eq("organization_id", organizationId)
      .single();

    if (!userOrg || !["OWNER", "ADMIN", "ACCOUNTANT"].includes(userOrg.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Fetch invoices for period
    const { data: invoices, error: fetchError } = await supabase
      .from("vat_invoices")
      .select("*")
      .eq("organization_id", organizationId)
      .gte("invoice_date", periodStart)
      .lte("invoice_date", periodEnd);

    if (fetchError) {
      console.error("Fetch invoices error:", fetchError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch invoices" },
        { status: 500 }
      );
    }

    // Compute VAT position
    const position = computeVATPosition(invoices || [], periodStart, periodEnd);

    // Store computation record (immutable)
    const computationData = {
      organization_id: organizationId,
      tax_period_id: taxPeriodId,
      tax_type: "VAT",
      computation_data: {
        position,
        invoiceCount: position.invoiceCount,
        periodStart,
        periodEnd,
      },
      computed_amount: position.netVATPayable,
      computed_by: user.id,
    };

    const { data: computation, error: insertError } = await supabase
      .from("tax_computations")
      .insert(computationData)
      .select()
      .single();

    if (insertError) {
      console.error("Computation insert error:", insertError);
      // Non-fatal - return position anyway
    }

    // Update tax period status
    if (taxPeriodId) {
      await supabase
        .from("tax_periods")
        .update({ status: "COMPUTED" })
        .eq("id", taxPeriodId);
    }

    return NextResponse.json({
      success: true,
      position,
      computation: computation || null,
    });
  } catch (error) {
    console.error("Compute VAT error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
