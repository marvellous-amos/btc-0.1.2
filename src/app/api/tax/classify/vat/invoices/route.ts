/**
 * API ROUTE: /api/tax/vat/invoices
 * CRUD operations for VAT invoices
 *
 * FILE: src/app/api/tax/vat/invoices/route.ts
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  calculateInvoiceVAT,
  validateVATInvoice,
  VATInvoice,
  // type VATLineItem,
} from "@/lib/tax/vat-computation";

// =====================================================
// POST /api/tax/vat/invoices - Create Invoice
// =====================================================

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
    const {
      organizationId,
      invoiceNumber,
      invoiceDate,
      customerName,
      customerTIN,
      invoiceType, // OUTPUT or INPUT
      lineItems, // Array of line items
    } = body;

    // Validate required fields
    if (
      !organizationId ||
      !invoiceNumber ||
      !invoiceDate ||
      !customerName ||
      !invoiceType
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Authorization check
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

    // Calculate VAT
    const calculation = calculateInvoiceVAT({
      invoiceNumber,
      invoiceDate,
      customerName,
      lineItems: lineItems || [],
    });

    // Prepare invoice data
    const invoiceData = {
      organization_id: organizationId,
      invoice_number: invoiceNumber,
      invoice_date: invoiceDate,
      customer_name: customerName,
      customer_tin: customerTIN || null,
      gross_amount: calculation.subtotal,
      vat_rate: calculation.vatRate,
      vat_amount: calculation.vatAmount,
      total_amount: calculation.totalAmount,
      invoice_type: invoiceType,
      line_items: calculation.lineItems,
    };

    const domainInvoice: Partial<VATInvoice> = {
      invoiceNumber,
      invoiceDate,
      customerName,
      customerTIN,
      grossAmount: calculation.subtotal,
      vatRate: calculation.vatRate,
      vatAmount: calculation.vatAmount,
      totalAmount: calculation.totalAmount,
      invoiceType,
      lineItems: calculation.lineItems,
    };

    // Validate invoice
    const validation = validateVATInvoice(domainInvoice);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    // Insert invoice
    const { data: invoice, error: insertError } = await supabase
      .from("vat_invoices")
      .insert(invoiceData)
      .select()
      .single();

    if (insertError) {
      // Check for duplicate invoice number
      if (insertError.code === "23505") {
        return NextResponse.json(
          { success: false, error: "Invoice number already exists" },
          { status: 409 }
        );
      }

      console.error("Invoice insert error:", insertError);
      return NextResponse.json(
        { success: false, error: "Failed to create invoice" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        invoice,
        calculation,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create invoice error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// =====================================================
// GET /api/tax/vat/invoices - List Invoices
// =====================================================

export async function GET(request: NextRequest) {
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

    // Parse query params
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");
    const invoiceType = searchParams.get("type"); // OUTPUT or INPUT
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: "Organization ID required" },
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

    if (!userOrg) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Build query
    let query = supabase
      .from("vat_invoices")
      .select("*", { count: "exact" })
      .eq("organization_id", organizationId)
      .order("invoice_date", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (invoiceType) {
      query = query.eq("invoice_type", invoiceType);
    }
    if (startDate) {
      query = query.gte("invoice_date", startDate);
    }
    if (endDate) {
      query = query.lte("invoice_date", endDate);
    }

    const { data: invoices, error: fetchError, count } = await query;

    if (fetchError) {
      console.error("Fetch invoices error:", fetchError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch invoices" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      invoices: invoices || [],
      count: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("List invoices error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
