/**
 * VAT COMPUTATION ENGINE
 * Nigeria Tax Act 2024 - Chapter Six (Sections 142-156)
 *
 * Handles:
 * - VAT rate determination by year
 * - Invoice VAT calculation
 * - Monthly VAT position computation
 * - Zero-rated basic items classification
 */

// =====================================================
// TYPES AND INTERFACES
// =====================================================

export interface VATInvoice {
  id?: string;
  invoiceNumber: string;
  invoiceDate: string; // ISO date string
  customerName: string;
  customerTIN?: string;
  grossAmount: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  invoiceType: "OUTPUT" | "INPUT";
  isBasicItem?: boolean;
  lineItems?: VATLineItem[];
}

export interface VATLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  isBasicItem?: boolean;
}

export interface VATInvoiceCalculation {
  invoiceNumber: string;
  invoiceDate: string;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  lineItems: Array<
    VATLineItem & { lineTotal: number; vat: number; total: number }
  >;
}

export interface VATPosition {
  period: string;
  periodStart: string;
  periodEnd: string;
  outputVAT: number; // VAT on sales
  inputVAT: number; // VAT on purchases
  netVATPayable: number; // Output - Input (if positive)
  excessCredit: number; // Input - Output (if positive)
  invoiceCount: {
    output: number;
    input: number;
    total: number;
  };
  summary: string[];
}

// =====================================================
// VAT RATES (Section 146)
// =====================================================

/**
 * VAT rates per Nigeria Tax Act 2024, Section 146
 * - 2025: 10%
 * - 2026-2029: 12.5%
 * - 2030+: 15%
 */
export const VAT_RATES = {
  BASIC_ITEMS: 0, // Zero-rated
  EXEMPT: null, // Truly exempt (no VAT charged or recovered)
  STANDARD_2025: 0.1, // 10%
  STANDARD_2026_2029: 0.125, // 12.5%
  STANDARD_2030: 0.15, // 15%
} as const;

/**
 * Basic food items (zero-rated per Schedule XII)
 * Section 188: Taxable supplies chargeable at zero percent
 */
const BASIC_ITEMS_KEYWORDS = [
  // Cereals
  "bread",
  "rice",
  "maize",
  "wheat",
  "millet",
  "barley",
  "sorghum",
  "oats",

  // Proteins
  "beans",
  "milk",
  "fish",
  "meat",
  "chicken",
  "egg",

  // Cooking
  "cooking oil",
  "palm oil",
  "vegetable oil",
  "salt",

  // Tubers and vegetables
  "yam",
  "cassava",
  "potato",
  "plantain",
  "garri",

  // Others
  "honey",
  "flour",
];

// =====================================================
// VAT RATE DETERMINATION
// =====================================================

/**
 * Gets the standard VAT rate for a given date
 *
 * @param date Date to check (defaults to today)
 * @returns VAT rate as decimal (e.g., 0.10 for 10%)
 *
 * @example
 * ```typescript
 * const rate2025 = getVATRate(new Date('2025-06-01')); // 0.10
 * const rate2026 = getVATRate(new Date('2026-01-01')); // 0.125
 * const rate2030 = getVATRate(new Date('2030-01-01')); // 0.15
 * ```
 */
export function getVATRate(date: Date = new Date()): number {
  const year = date.getFullYear();

  if (year === 2025) {
    return VAT_RATES.STANDARD_2025;
  }

  if (year >= 2026 && year <= 2029) {
    return VAT_RATES.STANDARD_2026_2029;
  }

  return VAT_RATES.STANDARD_2030;
}

/**
 * Determines if an item description indicates a basic food item (zero-rated)
 *
 * @param description Item description
 * @returns true if item is zero-rated basic food item
 */
export function isBasicItem(description: string): boolean {
  const normalized = description.toLowerCase().trim();

  return BASIC_ITEMS_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

/**
 * Gets the applicable VAT rate for a specific item
 *
 * @param description Item description
 * @param invoiceDate Invoice date
 * @returns Applicable VAT rate (0 for basic items, standard rate otherwise)
 */
export function getApplicableVATRate(
  description: string,
  invoiceDate: Date = new Date()
): number {
  if (isBasicItem(description)) {
    return VAT_RATES.BASIC_ITEMS;
  }

  return getVATRate(invoiceDate);
}

// =====================================================
// INVOICE VAT CALCULATION
// =====================================================

/**
 * Calculates VAT for an invoice with line items
 *
 * @param invoice Invoice details with line items
 * @returns Detailed VAT calculation
 *
 * @example
 * ```typescript
 * const calculation = calculateInvoiceVAT({
 *   invoiceNumber: 'INV-001',
 *   invoiceDate: '2025-06-01',
 *   customerName: 'Customer Ltd',
 *   lineItems: [
 *     { description: 'Laptop', quantity: 1, unitPrice: 500000 },
 *     { description: 'Rice 50kg', quantity: 2, unitPrice: 50000, isBasicItem: true }
 *   ]
 * });
 *
 * console.log(calculation.vatAmount); // 50000 (only laptop taxed)
 * console.log(calculation.totalAmount); // 650000
 * ```
 */
export function calculateInvoiceVAT(invoice: {
  invoiceNumber: string;
  invoiceDate: string;
  customerName: string;
  lineItems: VATLineItem[];
}): VATInvoiceCalculation {
  const invoiceDate = new Date(invoice.invoiceDate);
  const standardRate = getVATRate(invoiceDate);

  let subtotal = 0;
  let totalVAT = 0;

  const calculatedLineItems = invoice.lineItems.map((item) => {
    const lineTotal = item.quantity * item.unitPrice;

    // Determine applicable rate (zero for basic items)
    const applicableRate = item.isBasicItem
      ? VAT_RATES.BASIC_ITEMS
      : standardRate;

    const lineVAT = lineTotal * applicableRate;

    subtotal += lineTotal;
    totalVAT += lineVAT;

    return {
      ...item,
      lineTotal,
      vat: lineVAT,
      total: lineTotal + lineVAT,
    };
  });

  return {
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoice.invoiceDate,
    subtotal,
    vatRate: standardRate,
    vatAmount: totalVAT,
    totalAmount: subtotal + totalVAT,
    lineItems: calculatedLineItems,
  };
}

/**
 * Simplified VAT calculation for single-item invoices
 *
 * @param grossAmount Amount before VAT
 * @param invoiceDate Invoice date
 * @param isBasicItem Whether item is zero-rated
 * @returns VAT amount
 */
export function calculateSimpleVAT(
  grossAmount: number,
  invoiceDate: Date = new Date(),
  isBasicItem: boolean = false
): number {
  if (isBasicItem) {
    return 0;
  }

  const rate = getVATRate(invoiceDate);
  return grossAmount * rate;
}

// =====================================================
// MONTHLY VAT POSITION COMPUTATION
// =====================================================

/**
 * Computes monthly VAT position from invoices
 *
 * @param invoices Array of VAT invoices for the period
 * @param periodStart Period start date (ISO string)
 * @param periodEnd Period end date (ISO string)
 * @returns Comprehensive VAT position
 *
 * @example
 * ```typescript
 * const position = computeVATPosition(
 *   invoices,
 *   '2025-06-01',
 *   '2025-06-30'
 * );
 *
 * console.log(position.netVATPayable); // Amount to remit to FIRS
 * console.log(position.excessCredit); // Carry forward to next month
 * ```
 */
export function computeVATPosition(
  invoices: VATInvoice[],
  periodStart: string,
  periodEnd: string
): VATPosition {
  // Filter invoices within period
  const periodInvoices = invoices.filter((inv) => {
    const invDate = new Date(inv.invoiceDate);
    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    return invDate >= start && invDate <= end;
  });

  // Calculate output VAT (sales)
  const outputInvoices = periodInvoices.filter(
    (inv) => inv.invoiceType === "OUTPUT"
  );
  const outputVAT = outputInvoices.reduce(
    (sum, inv) => sum + Number(inv.vatAmount),
    0
  );

  // Calculate input VAT (purchases)
  const inputInvoices = periodInvoices.filter(
    (inv) => inv.invoiceType === "INPUT"
  );
  const inputVAT = inputInvoices.reduce(
    (sum, inv) => sum + Number(inv.vatAmount),
    0
  );

  // Determine net position
  const netVATPayable = Math.max(0, outputVAT - inputVAT);
  const excessCredit = Math.max(0, inputVAT - outputVAT);

  // Build summary
  const summary: string[] = [];
  summary.push(
    `VAT Position for ${formatDate(periodStart)} to ${formatDate(periodEnd)}`
  );
  summary.push("");
  summary.push(`Output VAT (Sales): ₦${formatCurrency(outputVAT)}`);
  summary.push(`  From ${outputInvoices.length} sales invoices`);
  summary.push("");
  summary.push(`Input VAT (Purchases): ₦${formatCurrency(inputVAT)}`);
  summary.push(`  From ${inputInvoices.length} purchase invoices`);
  summary.push("");

  if (netVATPayable > 0) {
    summary.push(`Net VAT Payable: ₦${formatCurrency(netVATPayable)}`);
    summary.push("Action: Remit to FIRS by 21st of following month");
  } else if (excessCredit > 0) {
    summary.push(`Excess Credit: ₦${formatCurrency(excessCredit)}`);
    summary.push("Action: Carry forward to next period");
  } else {
    summary.push("Net VAT Position: ₦0.00 (balanced)");
  }

  return {
    period: `${formatDate(periodStart)} to ${formatDate(periodEnd)}`,
    periodStart,
    periodEnd,
    outputVAT,
    inputVAT,
    netVATPayable,
    excessCredit,
    invoiceCount: {
      output: outputInvoices.length,
      input: inputInvoices.length,
      total: periodInvoices.length,
    },
    summary,
  };
}

/**
 * Computes cumulative VAT position across multiple periods
 * Handles carry-forward of excess credits
 */
export function computeCumulativeVATPosition(
  periods: Array<{ invoices: VATInvoice[]; start: string; end: string }>
): VATPosition[] {
  const positions: VATPosition[] = [];
  let carryForwardCredit = 0;

  for (const period of periods) {
    const position = computeVATPosition(
      period.invoices,
      period.start,
      period.end
    );

    // Apply carry-forward credit
    if (carryForwardCredit > 0) {
      const adjustedPayable = Math.max(
        0,
        position.netVATPayable - carryForwardCredit
      );
      const creditUsed = position.netVATPayable - adjustedPayable;

      position.netVATPayable = adjustedPayable;
      carryForwardCredit -= creditUsed;

      position.summary.push("");
      position.summary.push(
        `Carry-forward credit applied: ₦${formatCurrency(creditUsed)}`
      );
    }

    // Update carry-forward for next period
    carryForwardCredit += position.excessCredit;

    positions.push(position);
  }

  return positions;
}

// =====================================================
// VALIDATION FUNCTIONS
// =====================================================

/**
 * Validates VAT invoice data
 */
export function validateVATInvoice(invoice: Partial<VATInvoice>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!invoice.invoiceNumber) {
    errors.push("Invoice number is required");
  }

  if (!invoice.invoiceDate) {
    errors.push("Invoice date is required");
  } else {
    const date = new Date(invoice.invoiceDate);
    if (isNaN(date.getTime())) {
      errors.push("Invalid invoice date format");
    }
  }

  if (!invoice.customerName) {
    errors.push("Customer name is required");
  }

  if (!invoice.grossAmount || invoice.grossAmount < 0) {
    errors.push("Valid gross amount is required");
  }

  if (
    !invoice.invoiceType ||
    !["OUTPUT", "INPUT"].includes(invoice.invoiceType)
  ) {
    errors.push("Invoice type must be OUTPUT or INPUT");
  }

  // Validate VAT calculation
  if (invoice.grossAmount && invoice.vatRate !== undefined) {
    const expectedVAT = invoice.grossAmount * invoice.vatRate;
    const tolerance = 0.01; // 1 kobo tolerance for rounding

    if (Math.abs((invoice.vatAmount || 0) - expectedVAT) > tolerance) {
      errors.push("VAT amount does not match gross amount × VAT rate");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

export function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// =====================================================
// EXPORT FOR TESTING
// =====================================================

export const __test__ = {
  VAT_RATES,
  BASIC_ITEMS_KEYWORDS,
  formatCurrency,
  formatDate,
};
