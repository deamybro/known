"use client";

import { useEffect, useState } from "react";
import { Users, CheckCircle, ShieldAlert, Sparkles, Tag, ArrowRight } from "lucide-react";
import Link from "next/link";

interface ConfirmedPayee {
  id: string;
  chain: string;
  address: string;
  label: string;
  sendCount: number;
  typicalLowRaw?: string;
  typicalHighRaw?: string;
  decimals: number;
  assetSymbol: string;
  confirmedAt: string;
}

interface SuggestedPayee {
  chain: string;
  address: string;
  normalized: string;
  sendCount: number;
  typicalLowRaw: string;
  typicalHighRaw: string;
  decimals: number;
  assetSymbol: string;
  isLookalikeOfConfirmed?: {
    imitatesLabel: string;
  };
}

export default function PayeesPage() {
  const [confirmed, setConfirmed] = useState<ConfirmedPayee[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestedPayee[]>([]);
  const [totalTransfers, setTotalTransfers] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Labeling modal state
  const [confirmingPayee, setConfirmingPayee] = useState<SuggestedPayee | null>(null);
  const [labelInput, setLabelInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    try {
      const res = await fetch("/api/payees");
      const data = await res.json();
      if (data.confirmed) setConfirmed(data.confirmed);
      if (data.suggestions) setSuggestions(data.suggestions);
      if (data.totalTransfers !== undefined) setTotalTransfers(data.totalTransfers);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleConfirmSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!confirmingPayee || !labelInput.trim()) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/payees/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chain: confirmingPayee.chain,
          address: confirmingPayee.address,
          label: labelInput.trim(),
          sendCount: confirmingPayee.sendCount,
          typicalLowRaw: confirmingPayee.typicalLowRaw,
          typicalHighRaw: confirmingPayee.typicalHighRaw,
          decimals: confirmingPayee.decimals,
          assetSymbol: confirmingPayee.assetSymbol,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to confirm payee");
      }

      setConfirmingPayee(null);
      setLabelInput("");
      await loadData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  function formatTypicalRange(lowRaw: string, highRaw: string, decimals: number, symbol: string): string {
    try {
      const low = Number(BigInt(lowRaw)) / 10 ** decimals;
      const high = Number(BigInt(highRaw)) / 10 ** decimals;
      if (low === 0 && high === 0) return `Any amount (${symbol})`;
      return `${low.toLocaleString()} - ${high.toLocaleString()} ${symbol}`;
    } catch {
      return `~ ${symbol}`;
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-sky-400" />
          Payee Memory Book
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Known learns who you really pay from your actual outgoing transactions, stored in Walrus Memory.
        </p>
      </div>

      {/* Suggested Payees Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Suggested Payees From Your History</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs">
              {suggestions.length}
            </span>
          </h2>
          {totalTransfers === 0 && (
            <Link
              href="/wallets"
              className="text-xs text-sky-400 hover:underline flex items-center gap-1"
            >
              <span>Import history first</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Analyzing transaction history...</div>
        ) : suggestions.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 text-center space-y-2">
            <p className="text-slate-400 text-sm">No new suggested payees found.</p>
            <p className="text-xs text-slate-500">
              {totalTransfers === 0
                ? "Go to the Wallets tab and click 'Import History' to let Known learn from your real transfers."
                : "All outgoing counterparties are already confirmed."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {suggestions.map((s, idx) => {
              const isLookalike = !!s.isLookalikeOfConfirmed;

              return (
                <div
                  key={idx}
                  className={`bg-slate-900 border rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    isLookalike ? "border-red-500/50 bg-red-950/20" : "border-slate-800"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-xs uppercase font-bold">
                        {s.chain}
                      </span>
                      <span className="text-xs text-slate-400">
                        Paid <strong className="text-white">{s.sendCount} times</strong>
                      </span>
                      <span className="text-xs text-slate-500">
                        Typically {formatTypicalRange(s.typicalLowRaw, s.typicalHighRaw, s.decimals, s.assetSymbol)}
                      </span>
                    </div>
                    <div className="font-mono text-sm text-slate-200 break-all">{s.address}</div>

                    {isLookalike && (
                      <div className="text-xs text-red-400 flex items-center gap-1 font-medium">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Warning: Imitates confirmed payee {s.isLookalikeOfConfirmed?.imitatesLabel}!</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setConfirmingPayee(s);
                      setLabelInput("");
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition ${
                      isLookalike
                        ? "bg-red-900/60 hover:bg-red-800 text-red-200"
                        : "bg-sky-600 hover:bg-sky-500 text-white"
                    }`}
                  >
                    Confirm & Label
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmed Payees Section */}
      <div className="space-y-3 pt-4">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>Confirmed People You Pay</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs">
            {confirmed.length}
          </span>
        </h2>

        {confirmed.length === 0 ? (
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-6 text-center text-sm text-slate-500">
            No confirmed payees yet. Confirm suggested payees above to populate your protected Walrus memory.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {confirmed.map((p) => (
              <div
                key={p.id}
                className="bg-slate-900 border border-emerald-950/40 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-emerald-300">{p.label}</span>
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-xs uppercase font-bold">
                      {p.chain}
                    </span>
                    <span className="text-xs text-slate-400">Paid {p.sendCount} times</span>
                  </div>
                  <div className="font-mono text-xs text-slate-300 break-all">{p.address}</div>
                </div>

                <div className="text-xs text-emerald-400/80 bg-emerald-950/30 border border-emerald-800/30 px-2.5 py-1 rounded-md shrink-0">
                  Protected in Walrus Memory
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Label Modal Dialog */}
      {confirmingPayee && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Tag className="w-5 h-5 text-sky-400" />
              Confirm & Name This Payee
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Give this address a clear name you recognize (e.g. &quot;Ada, sister&quot; or &quot;Binance Deposit&quot;).
              Known will remember this address in your Walrus Memory and protect against lookalikes.
            </p>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
              <span className="text-xs text-slate-500 uppercase font-bold">{confirmingPayee.chain}</span>
              <p className="font-mono text-xs text-slate-200 break-all">{confirmingPayee.address}</p>
            </div>

            <form onSubmit={handleConfirmSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Payee Name / Label</label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="e.g. Ada, my sister"
                  value={labelInput}
                  onChange={(e) => setLabelInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmingPayee(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !labelInput.trim()}
                  className="bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg text-xs transition"
                >
                  {submitting ? "Saving to Memory..." : "Save to Walrus Memory"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
