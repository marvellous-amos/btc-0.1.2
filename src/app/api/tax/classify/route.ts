/**
 * API ROUTE: /api/tax/classify
 * POST endpoint for entity classification
 *
 * FILE: src/app/api/tax/classify/route.ts
 *
 * FIXED: Removed await from createClient() call
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  classifyEntity,
  validateClassificationInput,
  type ClassificationInput,
} from "@/lib/tax/entity-classification";

// =====================================================
// TYPE DEFINITIONS
// =====================================================

interface ClassifyRequestBody {
  organizationId: string;
  turnover: number;
  fixedAssets: number;
  isProfessionalServices: boolean;
  industryCode?: string;
}

interface ClassifyResponse {
  success: boolean;
  classification?: {
    id: string;
    result: "SMALL" | "STANDARD";
    citExempt: boolean;
    devLevyApplicable: boolean;
    reasoning: string[];
    thresholds: unknown;
    taxImplications: unknown;
    createdAt: string;
  };
  organization?: {
    id: string;
    name: string;
    classification: "SMALL" | "STANDARD";
  };
  error?: string;
  errors?: string[];
}

// =====================================================
// POST /api/tax/classify
// =====================================================

export async function POST(
  request: NextRequest
): Promise<NextResponse<ClassifyResponse>> {
  try {
    // Initialize Supabase client (await is required)
    const supabase = await createClient();

    // ========================================
    // 1. AUTHENTICATION CHECK
    // ========================================
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Please sign in to continue",
        },
        { status: 401 }
      );
    }

    // ========================================
    // 2. PARSE AND VALIDATE REQUEST BODY
    // ========================================
    let body: ClassifyRequestBody;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body - JSON parsing failed",
        },
        { status: 400 }
      );
    }

    const {
      organizationId,
      turnover,
      fixedAssets,
      isProfessionalServices,
      industryCode,
    } = body;

    // Validate required fields
    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: "Organization ID is required",
        },
        { status: 400 }
      );
    }

    // Validate classification inputs
    const validation = validateClassificationInput({
      turnover,
      fixedAssets,
      isProfessionalServices,
    });

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

    // ========================================
    // 3. AUTHORIZATION CHECK
    // ========================================
    const { data: userOrg, error: accessError } = await supabase
      .from("user_organizations")
      .select("role")
      .eq("user_id", user.id)
      .eq("organization_id", organizationId)
      .single();

    if (accessError || !userOrg) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden - You do not have access to this organization",
        },
        { status: 403 }
      );
    }

    // Only OWNER, ADMIN, and ACCOUNTANT can classify
    if (!["OWNER", "ADMIN", "ACCOUNTANT"].includes(userOrg.role)) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden - Insufficient permissions to classify entity",
        },
        { status: 403 }
      );
    }

    // ========================================
    // 4. FETCH ORGANIZATION DETAILS
    // ========================================
    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .select("id, name, tin")
      .eq("id", organizationId)
      .single();

    if (orgError || !organization) {
      return NextResponse.json(
        {
          success: false,
          error: "Organization not found",
        },
        { status: 404 }
      );
    }

    // ========================================
    // 5. PERFORM CLASSIFICATION
    // ========================================
    const classificationInput: ClassificationInput = {
      turnover,
      fixedAssets,
      isProfessionalServices,
      industryCode,
    };

    const result = classifyEntity(classificationInput);

    // ========================================
    // 6. STORE CLASSIFICATION RECORD (IMMUTABLE)
    // ========================================
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    const { data: classificationRecord, error: insertError } = await supabase
      .from("entity_classifications")
      .insert({
        organization_id: organizationId,
        classification_date: today,
        turnover_amount: turnover,
        fixed_assets_amount: fixedAssets,
        is_professional_services: isProfessionalServices,
        classification_result: result.classification,
        cit_exempt: result.citExempt,
        dev_levy_applicable: result.devLevyApplicable,
        classification_logic: {
          reasoning: result.reasoning,
          thresholds: result.thresholds,
          taxImplications: result.taxImplications,
        },
        thresholds_applied: result.thresholds,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Classification insert error:", insertError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to save classification record",
        },
        { status: 500 }
      );
    }

    // ========================================
    // 7. UPDATE ORGANIZATION CLASSIFICATION
    // ========================================
    const { error: updateError } = await supabase
      .from("organizations")
      .update({
        entity_classification: result.classification,
        classification_last_updated: today,
        annual_turnover: turnover,
        fixed_assets_value: fixedAssets,
        is_professional_services: isProfessionalServices,
      })
      .eq("id", organizationId);

    if (updateError) {
      console.error("Organization update error:", updateError);
      // Non-fatal - classification record was saved
    }

    // ========================================
    // 8. RETURN SUCCESS RESPONSE
    // ========================================
    return NextResponse.json(
      {
        success: true,
        classification: {
          id: classificationRecord.id,
          result: result.classification,
          citExempt: result.citExempt,
          devLevyApplicable: result.devLevyApplicable,
          reasoning: result.reasoning,
          thresholds: result.thresholds,
          taxImplications: result.taxImplications,
          createdAt: classificationRecord.created_at,
        },
        organization: {
          id: organization.id,
          name: organization.name,
          classification: result.classification,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Classification error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error - Classification failed",
      },
      { status: 500 }
    );
  }
}

// =====================================================
// GET /api/tax/classify?organizationId=xxx
// Retrieve classification history
// =====================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
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

    // Get organizationId from query params
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: "Organization ID is required" },
        { status: 400 }
      );
    }

    // Authorization check
    const { data: userOrg, error: accessError } = await supabase
      .from("user_organizations")
      .select("role")
      .eq("user_id", user.id)
      .eq("organization_id", organizationId)
      .single();

    if (accessError || !userOrg) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Fetch classification history
    const { data: classifications, error: fetchError } = await supabase
      .from("entity_classifications")
      .select("*")
      .eq("organization_id", organizationId)
      .order("classification_date", { ascending: false });

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch classifications" },
        { status: 500 }
      );
    }

    // Fetch current organization data
    const { data: organization } = await supabase
      .from("organizations")
      .select(
        "id, name, tin, entity_classification, classification_last_updated"
      )
      .eq("id", organizationId)
      .single();

    return NextResponse.json({
      success: true,
      organization,
      classifications: classifications || [],
      count: classifications?.length || 0,
    });
  } catch (error) {
    console.error("Get classifications error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
