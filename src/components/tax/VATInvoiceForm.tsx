/**
 * VAT Invoice Form Component
 * FILE: src/components/tax/VATInvoiceForm.tsx
 */

import {
  calculateInvoiceVAT,
  VATInvoice,
  VATInvoiceCalculation,
  VATLineItem,
} from "@/src/lib/tax/vat-computation";
import { useState } from "react";

interface VATInvoiceFormProps {
  organizationId: string;
  onSuccess?: (invoice: VATInvoice) => void;
}

export default function VATInvoiceForm({
  organizationId,
  onSuccess,
}: VATInvoiceFormProps) {
  const [invoiceData, setInvoiceData] = useState<{
    invoiceNumber: string;
    invoiceDate: string;
    customerName: string;
    customerTIN: string;
    invoiceType: "OUTPUT" | "INPUT";
  }>({
    invoiceNumber: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    customerName: "",
    customerTIN: "",
    invoiceType: "OUTPUT",
  });

  const [lineItems, setLineItems] = useState<VATLineItem[]>([
    { description: "", quantity: 1, unitPrice: 0, isBasicItem: false },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<VATInvoiceCalculation | null>(null);

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { description: "", quantity: 1, unitPrice: 0, isBasicItem: false },
    ]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = <K extends keyof VATLineItem>(
    index: number,
    field: K,
    value: VATLineItem[K]
  ) => {
    setLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const calculatePreview = () => {
    const calculation = calculateInvoiceVAT({
      invoiceNumber: invoiceData.invoiceNumber,
      invoiceDate: invoiceData.invoiceDate,
      customerName: invoiceData.customerName,
      lineItems,
    });
    setPreview(calculation);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/tax/vat/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          ...invoiceData,
          lineItems,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create invoice");
      }

      onSuccess?.(data.invoice);

      // Reset form
      setInvoiceData({
        invoiceNumber: "",
        invoiceDate: new Date().toISOString().split("T")[0],
        customerName: "",
        customerTIN: "",
        invoiceType: "OUTPUT",
      });
      setLineItems([
        { description: "", quantity: 1, unitPrice: 0, isBasicItem: false },
      ]);
      setPreview(null);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Create VAT Invoice
      </h2>

      <div className="space-y-6">
        {/* Invoice Header */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invoice Number *
            </label>
            <input
              type="text"
              value={invoiceData.invoiceNumber}
              onChange={(e) =>
                setInvoiceData({
                  ...invoiceData,
                  invoiceNumber: e.target.value,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              placeholder="INV-001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invoice Date *
            </label>
            <input
              type="date"
              value={invoiceData.invoiceDate}
              onChange={(e) =>
                setInvoiceData({ ...invoiceData, invoiceDate: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Name *
            </label>
            <input
              type="text"
              value={invoiceData.customerName}
              onChange={(e) =>
                setInvoiceData({ ...invoiceData, customerName: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              placeholder="Customer Ltd"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer TIN (Optional)
            </label>
            <input
              type="text"
              value={invoiceData.customerTIN}
              onChange={(e) =>
                setInvoiceData({ ...invoiceData, customerTIN: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              placeholder="12345678-0001"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Invoice Type *
          </label>
          <select
            value={invoiceData.invoiceType}
            onChange={(e) =>
              setInvoiceData({
                ...invoiceData,
                invoiceType: e.target.value as "OUTPUT" | "INPUT",
              })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
          >
            <option value="OUTPUT">OUTPUT (Sales - VAT Collected)</option>
            <option value="INPUT">INPUT (Purchases - VAT Paid)</option>
          </select>
        </div>

        {/* Line Items */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-800">Line Items</h3>
            <button
              onClick={addLineItem}
              className="px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
            >
              + Add Item
            </button>
          </div>

          <div className="space-y-4">
            {lineItems.map((item, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-md">
                <div className="grid grid-cols-12 gap-3 items-start">
                  <div className="col-span-5">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) =>
                        updateLineItem(index, "description", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Item description"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        updateLineItem(
                          index,
                          "quantity",
                          parseFloat(e.target.value)
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Qty"
                      min="0"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) =>
                        updateLineItem(
                          index,
                          "unitPrice",
                          parseFloat(e.target.value)
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Unit Price"
                      min="0"
                    />
                  </div>
                  <div className="col-span-2 flex items-center justify-between">
                    <label className="flex items-center text-xs">
                      <input
                        type="checkbox"
                        checked={item.isBasicItem}
                        onChange={(e) =>
                          updateLineItem(index, "isBasicItem", e.target.checked)
                        }
                        className="mr-1 h-4 w-4"
                      />
                      0%
                    </label>
                    {lineItems.length > 1 && (
                      <button
                        onClick={() => removeLineItem(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preview Button */}
        <button
          onClick={calculatePreview}
          className="w-full bg-blue-600 text-white py-2 px-6 rounded-md font-medium hover:bg-blue-700 transition-colors"
        >
          Calculate VAT
        </button>

        {/* Preview */}
        {preview && (
          <div className="p-4 bg-blue-50 rounded-md">
            <h4 className="font-medium mb-2">Invoice Summary</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>
                  ₦
                  {preview.subtotal.toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>VAT (10%):</span>
                <span>
                  ₦
                  {preview.vatAmount.toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between font-bold text-base border-t pt-1">
                <span>Total:</span>
                <span>
                  ₦
                  {preview.totalAmount.toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={
            loading || !invoiceData.invoiceNumber || !invoiceData.customerName
          }
          className="w-full bg-green-600 text-white py-3 px-6 rounded-md font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Creating Invoice..." : "Create Invoice"}
        </button>
      </div>
    </div>
  );
}
