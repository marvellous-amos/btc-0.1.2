"use client";
import { useState } from "react";
import { ClassificationResult } from "@/lib/tax/entity-classification";

export type ClassificationApiResponse = {
  success: boolean;
  classification: ClassificationResult;
};

interface ClassificationFormProps {
  organizationId: string;
  onSuccess?: (result: ClassificationApiResponse) => void;
}

export default function ClassificationForm({
  organizationId,
  onSuccess,
}: ClassificationFormProps) {
  const [formData, setFormData] = useState({
    turnover: "",
    fixedAssets: "",
    isProfessionalServices: false,
  });

  const [result, setResult] = useState<ClassificationApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/tax/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          turnover: parseFloat(formData.turnover),
          fixedAssets: parseFloat(formData.fixedAssets),
          isProfessionalServices: formData.isProfessionalServices,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Classification failed");
      }

      setResult(data);
      onSuccess?.(data);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value.replace(/,/g, ""));
    return isNaN(num) ? "" : num.toLocaleString("en-NG");
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Entity Classification
      </h2>

      <p className="text-sm text-gray-600 mb-6">
        Classify your company as SMALL or STANDARD per Nigeria Tax Act 2024,
        Section 56
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Annual Turnover */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Annual Turnover (₦)
          </label>
          <input
            type="text"
            value={formData.turnover}
            onChange={(e) => {
              const value = e.target.value.replace(/,/g, "");
              if (/^\d*\.?\d*$/.test(value)) {
                setFormData({ ...formData, turnover: value });
              }
            }}
            onBlur={(e) => {
              const formatted = formatCurrency(e.target.value);
              setFormData({ ...formData, turnover: formatted });
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="50,000,000"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Small company threshold: ₦50,000,000
          </p>
        </div>

        {/* Fixed Assets */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fixed Assets Value (₦)
          </label>
          <input
            type="text"
            value={formData.fixedAssets}
            onChange={(e) => {
              const value = e.target.value.replace(/,/g, "");
              if (/^\d*\.?\d*$/.test(value)) {
                setFormData({ ...formData, fixedAssets: value });
              }
            }}
            onBlur={(e) => {
              const formatted = formatCurrency(e.target.value);
              setFormData({ ...formData, fixedAssets: formatted });
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="250,000,000"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Small company threshold: ₦250,000,000
          </p>
        </div>

        {/* Professional Services */}
        <div className="flex items-start">
          <input
            type="checkbox"
            checked={formData.isProfessionalServices}
            onChange={(e) =>
              setFormData({
                ...formData,
                isProfessionalServices: e.target.checked,
              })
            }
            className="mt-1 h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
          />
          <label className="ml-3 block text-sm text-gray-700">
            <span className="font-medium">Professional Services Business</span>
            <p className="text-xs text-gray-500 mt-1">
              Check if your business provides professional services (legal,
              accounting, consulting, etc.)
            </p>
          </label>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
            <p className="font-medium">Classification Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 px-6 rounded-md font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Classifying..." : "Classify Entity"}
        </button>
      </form>

      {/* Classification Result */}
      {result && (
        <div className="mt-8 border-t pt-6">
          <div
            className={`p-6 rounded-lg ${
              result.classification.classification === "SMALL"
                ? "bg-green-50 border-2 border-green-200"
                : "bg-blue-50 border-2 border-blue-200"
            }`}
          >
            <h3 className="text-xl font-bold mb-4">
              Classification Result: {result.classification.classification}{" "}
              COMPANY
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">CIT Status</p>
                <p className="font-semibold">
                  {result.classification.citExempt ? "✅ EXEMPT" : "❌ TAXABLE"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Development Levy</p>
                <p className="font-semibold">
                  {result.classification.devLevyApplicable
                    ? "❌ APPLICABLE"
                    : "✅ EXEMPT"}
                </p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-white rounded-md">
              <p className="font-medium mb-2">Reasoning:</p>
              <ul className="text-sm space-y-1">
                {result.classification.reasoning.map(
                  (reason: string, idx: number) => (
                    <li key={idx} className="text-gray-700">
                      {reason}
                    </li>
                  )
                )}
              </ul>
            </div>

            <div className="mt-4 p-4 bg-white rounded-md">
              <p className="font-medium mb-2">Tax Implications:</p>
              <ul className="text-sm space-y-1 text-gray-700">
                <li>
                  • CIT Rate:{" "}
                  {(
                    result.classification.taxImplications.citRate * 100
                  ).toFixed(1)}
                  %
                </li>
                <li>
                  • Development Levy:{" "}
                  {(
                    result.classification.taxImplications.devLevyRate * 100
                  ).toFixed(1)}
                  %
                </li>
                <li>
                  • VAT Applicable:{" "}
                  {result.classification.taxImplications.vatApplicable
                    ? "Yes"
                    : "No"}
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
