/**
 * ENTITY CLASSIFICATION ENGINE
 * Nigeria Tax Act 2024 - Section 56
 *
 * Determines if a company qualifies as SMALL or STANDARD
 * Small companies are exempt from Company Income Tax (CIT)
 */

// =====================================================
// TYPES AND INTERFACES
// =====================================================

export interface ClassificationInput {
  /** Annual turnover in Naira */
  turnover: number;
  /** Total fixed assets value in Naira */
  fixedAssets: number;
  /** Whether business provides professional services */
  isProfessionalServices: boolean;
  /** Optional industry classification code */
  industryCode?: string;
}

export interface ClassificationResult {
  /** Classification result: SMALL or STANDARD */
  classification: "SMALL" | "STANDARD";
  /** Whether exempt from Company Income Tax */
  citExempt: boolean;
  /** Whether subject to Development Levy */
  devLevyApplicable: boolean;
  /** Human-readable reasoning steps */
  reasoning: string[];
  /** Thresholds applied in this classification */
  thresholds: {
    turnoverThreshold: number;
    assetsThreshold: number;
    turnoverMet: boolean;
    assetsMet: boolean;
  };
  /** Tax implications summary */
  taxImplications: {
    citRate: number;
    devLevyRate: number;
    vatApplicable: boolean;
  };
}

// =====================================================
// CONSTANTS (from Nigeria Tax Act 2024)
// =====================================================

/**
 * Small Company Definition - Section 56
 * - Turnover ≤ ₦50,000,000
 * - Fixed Assets ≤ ₦250,000,000
 * - NOT providing professional services
 */
export const CLASSIFICATION_THRESHOLDS = {
  /** Maximum annual turnover for small company classification */
  TURNOVER_THRESHOLD: 50_000_000, // ₦50 million

  /** Maximum fixed assets value for small company classification */
  ASSETS_THRESHOLD: 250_000_000, // ₦250 million
} as const;

/**
 * Tax Rates - Sections 56, 59
 */
export const TAX_RATES = {
  /** CIT rate for 2025 */
  CIT_2025: 0.275, // 27.5%

  /** CIT rate from 2026 onwards */
  CIT_2026_ONWARDS: 0.25, // 25%

  /** Development Levy 2025-2026 */
  DEV_LEVY_2025_2026: 0.04, // 4%

  /** Development Levy 2027-2029 */
  DEV_LEVY_2027_2029: 0.03, // 3%

  /** Development Levy 2030+ */
  DEV_LEVY_2030_ONWARDS: 0.02, // 2%
} as const;

/**
 * Professional Services (excluded from SMALL classification)
 * Based on common interpretation of professional services
 */
const PROFESSIONAL_SERVICES_KEYWORDS = [
  "legal",
  "law",
  "accounting",
  "audit",
  "consulting",
  "architecture",
  "engineering",
  "medical",
  "healthcare",
  "financial advisory",
  "tax advisory",
  "management consulting",
];

// =====================================================
// CORE CLASSIFICATION LOGIC
// =====================================================

/**
 * Classifies an entity as SMALL or STANDARD per Nigeria Tax Act 2024
 *
 * @param input Classification inputs (turnover, assets, professional services flag)
 * @returns Comprehensive classification result with tax implications
 *
 * @example
 * ```typescript
 * const result = classifyEntity({
 *   turnover: 45_000_000, // ₦45m
 *   fixedAssets: 200_000_000, // ₦200m
 *   isProfessionalServices: false
 * });
 *
 * console.log(result.classification); // "SMALL"
 * console.log(result.citExempt); // true
 * ```
 */
export function classifyEntity(
  input: ClassificationInput
): ClassificationResult {
  const reasoning: string[] = [];

  // Validate inputs
  if (input.turnover < 0 || input.fixedAssets < 0) {
    throw new Error("Turnover and fixed assets must be non-negative");
  }

  // Step 1: Check professional services exclusion
  if (input.isProfessionalServices) {
    reasoning.push("❌ Professional services exclusion");
    reasoning.push(
      "Professional services businesses cannot qualify as SMALL companies per Section 56"
    );

    return buildStandardResult(input, reasoning, "professional_services");
  }

  // Step 2: Evaluate turnover threshold
  const turnoverMet =
    input.turnover <= CLASSIFICATION_THRESHOLDS.TURNOVER_THRESHOLD;
  if (turnoverMet) {
    reasoning.push(
      `✓ Turnover test: ₦${formatCurrency(input.turnover)} ≤ ₦${formatCurrency(
        CLASSIFICATION_THRESHOLDS.TURNOVER_THRESHOLD
      )}`
    );
  } else {
    reasoning.push(
      `✗ Turnover test: ₦${formatCurrency(input.turnover)} > ₦${formatCurrency(
        CLASSIFICATION_THRESHOLDS.TURNOVER_THRESHOLD
      )}`
    );
  }

  // Step 3: Evaluate fixed assets threshold
  const assetsMet =
    input.fixedAssets <= CLASSIFICATION_THRESHOLDS.ASSETS_THRESHOLD;
  if (assetsMet) {
    reasoning.push(
      `✓ Assets test: ₦${formatCurrency(input.fixedAssets)} ≤ ₦${formatCurrency(
        CLASSIFICATION_THRESHOLDS.ASSETS_THRESHOLD
      )}`
    );
  } else {
    reasoning.push(
      `✗ Assets test: ₦${formatCurrency(input.fixedAssets)} > ₦${formatCurrency(
        CLASSIFICATION_THRESHOLDS.ASSETS_THRESHOLD
      )}`
    );
  }

  // Step 4: Determine classification (both thresholds must be met)
  const isSmall = turnoverMet && assetsMet;

  if (isSmall) {
    reasoning.push("");
    reasoning.push("✅ CLASSIFICATION: SMALL COMPANY");
    reasoning.push("Tax implications:");
    reasoning.push("  • EXEMPT from Company Income Tax (CIT)");
    reasoning.push("  • NOT subject to Development Levy");
    reasoning.push("  • Subject to VAT at applicable rates");

    return {
      classification: "SMALL",
      citExempt: true,
      devLevyApplicable: false,
      reasoning,
      thresholds: {
        turnoverThreshold: CLASSIFICATION_THRESHOLDS.TURNOVER_THRESHOLD,
        assetsThreshold: CLASSIFICATION_THRESHOLDS.ASSETS_THRESHOLD,
        turnoverMet,
        assetsMet,
      },
      taxImplications: {
        citRate: 0,
        devLevyRate: 0,
        vatApplicable: true,
      },
    };
  } else {
    const failureReason =
      !turnoverMet && !assetsMet
        ? "both_thresholds"
        : !turnoverMet
        ? "turnover"
        : "assets";

    return buildStandardResult(input, reasoning, failureReason);
  }
}

/**
 * Builds a STANDARD classification result
 */
function buildStandardResult(
  input: ClassificationInput,
  reasoning: string[],
  failureReason:
    | "professional_services"
    | "turnover"
    | "assets"
    | "both_thresholds"
): ClassificationResult {
  reasoning.push("");
  reasoning.push("❌ CLASSIFICATION: STANDARD COMPANY");
  reasoning.push("Tax implications:");
  reasoning.push("  • Subject to Company Income Tax (CIT) at 25% (from 2026)");
  reasoning.push("  • Subject to Development Levy at 4% (2025-2026)");
  reasoning.push("  • Subject to VAT at applicable rates");

  const turnoverMet =
    input.turnover <= CLASSIFICATION_THRESHOLDS.TURNOVER_THRESHOLD;
  const assetsMet =
    input.fixedAssets <= CLASSIFICATION_THRESHOLDS.ASSETS_THRESHOLD;

  return {
    classification: "STANDARD",
    citExempt: false,
    devLevyApplicable: true,
    reasoning,
    thresholds: {
      turnoverThreshold: CLASSIFICATION_THRESHOLDS.TURNOVER_THRESHOLD,
      assetsThreshold: CLASSIFICATION_THRESHOLDS.ASSETS_THRESHOLD,
      turnoverMet,
      assetsMet,
    },
    taxImplications: {
      citRate: TAX_RATES.CIT_2026_ONWARDS,
      devLevyRate: TAX_RATES.DEV_LEVY_2025_2026,
      vatApplicable: true,
    },
  };
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Format currency for display (Nigerian Naira)
 */
function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Detects if a business description indicates professional services
 * (Fallback when isProfessionalServices flag is not explicitly provided)
 */
export function isProfessionalServicesBusiness(
  businessDescription: string,
  industryCode?: string
): boolean {
  const lowerDescription = businessDescription.toLowerCase();

  return PROFESSIONAL_SERVICES_KEYWORDS.some((keyword) =>
    lowerDescription.includes(keyword)
  );
}

/**
 * Gets the current tax year
 */
export function getCurrentTaxYear(): number {
  return new Date().getFullYear();
}

/**
 * Gets the applicable CIT rate for a given year
 */
export function getCITRate(year: number = getCurrentTaxYear()): number {
  return year === 2025 ? TAX_RATES.CIT_2025 : TAX_RATES.CIT_2026_ONWARDS;
}

/**
 * Gets the applicable Development Levy rate for a given year
 */
export function getDevelopmentLevyRate(
  year: number = getCurrentTaxYear()
): number {
  if (year >= 2025 && year <= 2026) return TAX_RATES.DEV_LEVY_2025_2026;
  if (year >= 2027 && year <= 2029) return TAX_RATES.DEV_LEVY_2027_2029;
  return TAX_RATES.DEV_LEVY_2030_ONWARDS;
}

// =====================================================
// VALIDATION FUNCTIONS
// =====================================================

/**
 * Validates classification input data
 */
export function validateClassificationInput(
  input: Partial<ClassificationInput>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (input.turnover === undefined || input.turnover === null) {
    errors.push("Annual turnover is required");
  } else if (input.turnover < 0) {
    errors.push("Annual turnover cannot be negative");
  }

  if (input.fixedAssets === undefined || input.fixedAssets === null) {
    errors.push("Fixed assets value is required");
  } else if (input.fixedAssets < 0) {
    errors.push("Fixed assets value cannot be negative");
  }

  if (
    input.isProfessionalServices === undefined ||
    input.isProfessionalServices === null
  ) {
    errors.push("Professional services flag is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// =====================================================
// EXPORT FOR TESTING
// =====================================================

export const __test__ = {
  CLASSIFICATION_THRESHOLDS,
  TAX_RATES,
  formatCurrency,
  buildStandardResult,
};
