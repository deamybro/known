"use client";

import { useState } from "react";
import { ShieldCheck, ShieldAlert, AlertCircle, ArrowRight, CheckCircle2, Copy } from "lucide-react";
import { CheckVerdictResult } from "@known/core";

export default function CheckPage() {
  const [chain, setChain] = useState<string>("sui");
  const [address, setAddress] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<CheckVerdictResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCheck(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!address.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chain,
          address: address.trim(),
          amountRaw: amount ? (BigInt(Math.floor(parseFloat(amount) * 1e6))).toString() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to check address");
      }
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Visual diff highlighter
  function renderAddressWithHighlight(targetAddr: string, ranges?: Array<{ start: number; end: number }>) {
    if (!ranges || ranges.length === 0) {
      return <span className="font-mono break-all">{targetAddr}</span>;
    }

    const start = ranges[0].start;
    const end = ranges[0].end;

    // Accounts for '0x' prefix in targetAddr if hex
    const prefixOffset = targetAddr.startsWith("0x") ? 2 : 0;
    const actualStart = start + prefixOffset;
    const actualEnd = end + prefixOffset;

    const prefix = targetAddr.slice(0, actualStart);
    const middleDiff = targetAddr.slice(actualStart, actualEnd);
    const suffix = targetAddr.slice(actualEnd);

    return (
      <span className="font-mono break-all text-xs sm:text-sm">
        <span className="text-emerald-400 font-bold">{prefix}</span>
        <span className="bg-red-500/20 text-red-300 font-bold px-1 py-0.5 rounded border border-red-500/40">
          {middleDiff}
        </span>
        <span className="text-emerald-400 font-bold">{suffix}</span>
      </span>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero text */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Your transaction history can be poisoned. <br className="hidden sm:inline" />
          <span className="text-emerald-400">Your memory can&apos;t.</span>
        </h1>
        <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
          Known learns who you actually pay from your real history and remembers them in Walrus Memory.
          Paste an address below to catch lookalike poisoning attacks before you send money.
        </p>
      </div>

      {/* Check Box Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <form onSubmit={handleCheck} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="sm:w-44 shrink-0">
              <label className="block text-xs font-semibold text-slate-400 mb-1">Chain</label>
              <select
                value={chain}
                onChange={(e) => setChain(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white font-medium focus:outline-none focus:border-emerald-500"
              >
                <option value="sui">Sui</option>
                <option value="ethereum">Ethereum</option>
                <option value="bsc">BNB Chain</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Recipient Wallet Address
              </label>
              <input
                type="text"
                placeholder="Paste any address you plan to send to..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="w-full sm:w-64">
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Optional Amount (to check anomalies)
              </label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 50"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-slate-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !address.trim()}
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20"
            >
              <span>{loading ? "Checking Memory..." : "Check Address"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {error && (
          <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-400">
            {error}
          </div>
        )}
      </div>

      {/* Verdict Result Card */}
      {result && (
        <div
          className={`border rounded-2xl p-6 space-y-4 shadow-2xl transition-all ${
            result.verdict === "green"
              ? "bg-emerald-950/30 border-emerald-500/50"
              : result.verdict === "red"
              ? "bg-red-950/30 border-red-500/50"
              : "bg-amber-950/30 border-amber-500/50"
          }`}
        >
          {/* Header Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {result.verdict === "green" && <ShieldCheck className="w-6 h-6 text-emerald-400" />}
              {result.verdict === "red" && <ShieldAlert className="w-6 h-6 text-red-400" />}
              {result.verdict === "amber" && <AlertCircle className="w-6 h-6 text-amber-400" />}
              <span
                className={`text-lg font-black uppercase tracking-wider ${
                  result.verdict === "green"
                    ? "text-emerald-400"
                    : result.verdict === "red"
                    ? "text-red-400"
                    : "text-amber-400"
                }`}
              >
                {result.verdict === "green" && "SAFE — CONFIRMED PAYEE"}
                {result.verdict === "red" && "ALERT — ADDRESS POISONING DETECTED"}
                {result.verdict === "amber" && "WARNING — UNKNOWN PAYEE"}
              </span>
            </div>
            <span className="text-xs font-mono text-slate-500 uppercase">{result.chain}</span>
          </div>

          {/* Explanation */}
          <p className="text-base text-slate-100 font-medium leading-relaxed">
            {result.explanation}
          </p>

          {/* Lookalike character breakdown */}
          {result.imitates && (
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Visual Comparison (Green = matching, Red = attacker&apos;s fake characters)
              </div>
              <div className="space-y-1">
                <div>
                  <span className="text-xs text-slate-500 w-20 inline-block">Real {result.imitates.label}:</span>
                  <span className="font-mono text-xs text-slate-300 break-all">{result.imitates.address}</span>
                </div>
                <div>
                  <span className="text-xs text-red-400 font-semibold w-20 inline-block">Pasted Fake:</span>
                  {renderAddressWithHighlight(result.displayAddress, result.imitates.differingRanges)}
                </div>
              </div>
            </div>
          )}

          {/* Verified Memory Note */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Deterministic Rule: {result.reasons.join(", ")}</span>
            <span className="text-slate-500 font-mono">Checked at {new Date(result.checkedAt).toLocaleTimeString()}</span>
          </div>
        </div>
      )}

      {/* Live Demo Quick-Test Presets */}
      <div className="border border-slate-800/80 bg-slate-900/40 rounded-2xl p-5 space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Quick Demo Presets for Testing
        </h3>
        <p className="text-xs text-slate-500">
          Try pasting these demo addresses to observe how Known catches lookalike poisoning:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <button
            onClick={() => {
              setChain("sui");
              setAddress("0x565c34749525e936c4e43615f48c15f34031f18061d2f85df923032ca5864a38");
              setAmount("50");
            }}
            className="p-3 bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-left space-y-1 transition group"
          >
            <div className="font-semibold text-emerald-400 group-hover:underline">
              1. Real Payee Address (Ada)
            </div>
            <div className="font-mono text-slate-400 truncate">0x565c3474...864a38</div>
          </button>

          <button
            onClick={() => {
              setChain("sui");
              setAddress("0x5653a65331a67445085860b6759887f097122aa9960645989ba37a3a43d733be");
              setAmount("");
            }}
            className="p-3 bg-slate-950 border border-slate-800 hover:border-red-500/50 rounded-xl text-left space-y-1 transition group"
          >
            <div className="font-semibold text-red-400 group-hover:underline">
              2. Ground Lookalike Scam (matching &quot;565&quot;)
            </div>
            <div className="font-mono text-slate-400 truncate">0x5653a653...d733be</div>
          </button>
        </div>
      </div>
    </div>
  );
}
