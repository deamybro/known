"use client";

import { useEffect, useState } from "react";
import { Users, CheckCircle, ShieldAlert, Sparkles, Tag, ArrowRight, ShieldCheck, Database, Layers } from "lucide-react";
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
      const low = (Number(BigInt(lowRaw)) / 10 ** decimals).toFixed(decimals > 2 ? 2 : 0);
      const high = (Number(BigInt(highRaw)) / 10 ** decimals).toFixed(decimals > 2 ? 2 : 0);
      return `${low} – ${high} ${symbol}`;
    } catch {
      return `~ ${symbol}`;
    }
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="space-y-2 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/25 text-xs font-semibold text-sky-400">
          <Users className="w-3.5 h-3.5" />
          <span>Sovereign Payee Registry</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Confirmed Payees & Walrus Memory
        </h1>
        <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
          Recipients you have explicitly trusted. Their cryptographic signatures and historical transfer patterns
          are anchored directly into decentralized Walrus Memory.
        </p>
      </div>

      {/* Confirmed Payees List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Confirmed Payees ({confirmed.length})</span>
          </h2>
          <span className="text-xs text-slate-400">Anchored in Walrus Blobs</span>
        </div>

        {loading ? (
          <div className="glass-card p-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-3 rounded-2xl">
            <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            <span>Loading confirmed payees from Walrus Memory...</span>
          </div>
        ) : confirmed.length === 0 ? (
          <div className="glass-card p-12 text-center rounded-2xl space-y-3">
            <Users className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm text-slate-400">No payees confirmed yet.</p>
            <p className="text-xs text-slate-500">
              Import a wallet via Tatum in <Link href="/wallets" className="text-emerald-400 underline">Wallets</Link> to generate suggestions.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {confirmed.map((p) => (
              <div
                key={p.id}
                className="glass-card rounded-2xl p-5 border border-white/[0.08] hover:border-emerald-500/40 transition group space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-sm">
                      {p.label.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm group-hover:text-emerald-300 transition">
                        {p.label}
                      </h3>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 uppercase font-mono text-[9px] text-slate-300 font-bold">
                          {p.chain}
                        </span>
                        <span>{p.sendCount} transfers</span>
                      </div>
                    </div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-beacon" />
                </div>

                <div className="bg-[#060910] p-3 rounded-xl border border-white/5 font-mono text-xs text-slate-300 break-all select-all">
                  {p.address}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/5">
                  <span>
                    Typical:{" "}
                    <strong className="text-slate-200">
                      {p.typicalLowRaw && p.typicalHighRaw
                        ? formatTypicalRange(p.typicalLowRaw, p.typicalHighRaw, p.decimals, p.assetSymbol)
                        : `~ ${p.assetSymbol}`}
                    </strong>
                  </span>
                  <span className="text-emerald-400 font-mono text-[10px] flex items-center gap-1">
                    <Database className="w-3 h-3" />
                    <span>Walrus Synced</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Suggested Payees from History */}
      {suggestions.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-white/[0.08]">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span>Suggested from Tatum Ingested History ({suggestions.length})</span>
            </h2>
            <span className="text-xs text-slate-400">Repeated outgoing recipients (Dust excluded)</span>
          </div>

          <div className="space-y-3">
            {suggestions.map((s, idx) => (
              <div
                key={idx}
                className="glass-card rounded-2xl p-4 sm:p-5 border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 uppercase font-mono text-[10px] text-slate-300 font-bold">
                      {s.chain}
                    </span>
                    <span className="text-xs font-semibold text-slate-200">
                      {s.sendCount} outgoing transactions
                    </span>
                    {s.isLookalikeOfConfirmed && (
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" />
                        <span>Imitates &ldquo;{s.isLookalikeOfConfirmed.imitatesLabel}&rdquo;</span>
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-xs text-slate-400 truncate">
                    {s.address}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Typical transfer size:{" "}
                    <strong className="text-slate-300">
                      {formatTypicalRange(s.typicalLowRaw, s.typicalHighRaw, s.decimals, s.assetSymbol)}
                    </strong>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setConfirmingPayee(s);
                    setLabelInput("");
                  }}
                  className="px-4 py-2.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-xs font-bold transition flex items-center gap-2 shrink-0 self-start sm:self-center"
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>Label & Anchor in Walrus</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Label Modal */}
      {confirmingPayee && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-card rounded-[28px] p-6 max-w-md w-full border border-white/10 space-y-5 shadow-2xl">
            <div>
              <h3 className="text-lg font-black text-white">Confirm Sovereign Payee</h3>
              <p className="text-xs text-slate-400 mt-1">
                Give this recipient a recognizable name. It will be signed and synced to Walrus Memory.
              </p>
            </div>

            <form onSubmit={handleConfirmSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Recipient Address ({confirmingPayee.chain.toUpperCase()})
                </label>
                <div className="p-3 bg-[#060910] rounded-xl border border-white/10 font-mono text-xs text-slate-300 break-all">
                  {confirmingPayee.address}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Payee Label (e.g. &ldquo;Ada Sister&rdquo;, &ldquo;Landlord Rent&rdquo;)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter friendly label"
                  value={labelInput}
                  onChange={(e) => setLabelInput(e.target.value)}
                  className="w-full bg-[#060910] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition shadow-inner"
                  autoFocus
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmingPayee(null)}
                  className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !labelInput.trim()}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-xs font-black transition disabled:opacity-50"
                >
                  {submitting ? "Anchoring..." : "Save to Walrus"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
