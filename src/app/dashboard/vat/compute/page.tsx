"use client";

import { useState } from "react";
import {
  VATPosition,
  computeVATPosition,
  formatCurrency,
} from "@/lib/tax/vat-computation";

interface Period {
  start: string;
  end: string;
}

export default function VATComputePage() {
  const [period, setPeriod] = useState<Period>({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  const [position, setPosition] = useState<VATPosition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCompute = async () => {
    setLoading(true);
    setError(null);

    try {
      const orgId = "YOUR_ORG_ID"; // TODO: fetch dynamically from auth context

      const res = await fetch("/api/tax/vat/compute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: orgId,
          periodStart: period.start,
          periodEnd: period.end,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Computation failed");

      setPosition(data.position as VATPosition);
    } catch (err: unknown) {
      setError((err as Error).message);
      setPosition(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">VAT Position Computation</h1>

      {/* Period Selection */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Select Period</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Start Date</label>
            <input
              type="date"
              value={period.start}
              onChange={(e) => setPeriod({ ...period, start: e.target.value })}
              className="w-full px-4 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">End Date</label>
            <input
              type="date"
              value={period.end}
              onChange={(e) => setPeriod({ ...period, end: e.target.value })}
              className="w-full px-4 py-2 border rounded-md"
            />
          </div>
        </div>

        <button
          onClick={handleCompute}
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 rounded-md font-medium hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "Computing..." : "Compute VAT Position"}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* VAT Position Display */}
      {position && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">VAT Position</h2>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-md">
              <span className="font-medium">Output VAT (Sales)</span>
              <span className="text-xl font-bold">
                ₦{formatCurrency(position.outputVAT)}
              </span>
            </div>

            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-md">
              <span className="font-medium">Input VAT (Purchases)</span>
              <span className="text-xl font-bold">
                ₦{formatCurrency(position.inputVAT)}
              </span>
            </div>

            {position.netVATPayable > 0 && (
              <div className="flex justify-between items-center p-4 bg-yellow-50 border-2 border-yellow-400 rounded-md">
                <span className="font-medium">Net VAT Payable</span>
                <span className="text-2xl font-bold text-yellow-700">
                  ₦{formatCurrency(position.netVATPayable)}
                </span>
              </div>
            )}

            {position.excessCredit > 0 && (
              <div className="flex justify-between items-center p-4 bg-purple-50 border-2 border-purple-400 rounded-md">
                <span className="font-medium">
                  Excess Credit (Carry Forward)
                </span>
                <span className="text-2xl font-bold text-purple-700">
                  ₦{formatCurrency(position.excessCredit)}
                </span>
              </div>
            )}

            <div className="mt-6 p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium mb-2">Summary</h3>
              <ul className="text-sm space-y-1 text-gray-700">
                {position.summary.map((line, idx) => (
                  <li key={idx}>{line}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
