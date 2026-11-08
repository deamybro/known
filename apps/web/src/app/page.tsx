"use client";

import { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Copy,
  Check,
  Zap,
  Lock,
  Layers,
  Activity,
  ClipboardPaste,
} from "lucide-react";
import { CheckVerdictResult } from "@known/core";

export default function CheckPage() {
  const [chain, setChain] = useState<string>("sui");
  const [address, setAddress] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<CheckVerdictResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

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
          amountRaw: amount
            ? BigInt(Math.floor(parseFloat(amount) * 1e9)).toString()
            : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to evaluate recipient address");
      }
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setAddress(text.trim());
    } catch {
      // Clipboard read permission might not be granted in non-HTTPS
    }
  }

  function applyPresetScenario(targetChain: string, targetAddr: string, targetAmount: string) {
    setChain(targetChain);
    setAddress(targetAddr);
    setAmount(targetAmount);

    // Immediate check evaluation
    setTimeout(() => {
      const btn = document.getElementById("submit-verify-btn");
      if (btn) btn.click();
    }, 50);
  }

  function renderAddressWithHighlight(
    targetAddr: string,
    ranges?: Array<{ start: number; end: number }>
  ) {
    if (!ranges || ranges.length === 0) {
      return <span className="font-mono break-all text-xs sm:text-sm">{targetAddr}</span>;
    }

    const start = ranges[0].start;
    const end = ranges[0].end;
    const prefixOffset = targetAddr.startsWith("0x") ? 2 : 0;
    const actualStart = start + prefixOffset;
    const actualEnd = end + prefixOffset;

    const prefix = targetAddr.slice(0, actualStart);
    const middleDiff = targetAddr.slice(actualStart, actualEnd);
    const suffix = targetAddr.slice(actualEnd);

    return (
      <span className="font-mono break-all text-xs sm:text-sm leading-relaxed">
        <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/25">
          {prefix}
        </span>
        <span className="bg-rose-500/30 text-rose-200 font-bold px-1.5 py-0.5 rounded border border-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.4)]">
          {middleDiff}
        </span>
        <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/25">
          {suffix}
        </span>
      </span>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Section */}
      <div className="space-y-3.5 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xs font-semibold text-emerald-400 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Pre-Flight Sovereign Payment Defense</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          Your transaction history can be poisoned. <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            Your memory can&apos;t.
          </span>
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl leading-relaxed">
          Known learns who you actually pay from verified outgoing history and preserves your confirmed payees
          in decentralized Walrus Memory. Paste any address before sending funds to catch lookalike scam attacks.
        </p>
      </div>

      {/* Main Verification Card */}
      <div className="glass-card rounded-[28px] p-6 sm:p-8 space-y-6 relative overflow-hidden">
        {/* Specular line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />

        <form onSubmit={handleCheck} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
            {/* Chain Selector */}
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Target Chain</span>
                <span className="text-[10px] text-slate-500 font-mono">Tatum API</span>
              </label>
              <select
                value={chain}
                onChange={(e) => setChain(e.target.value)}
                className="w-full bg-[#060910] border border-white/10 rounded-xl px-3.5 py-3 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 transition shadow-inner"
              >
                <option value="sui">Sui Mainnet</option>
                <option value="ethereum">Ethereum</option>
                <option value="bsc">BNB Chain</option>
                <option value="base">Base</option>
                <option value="polygon">Polygon</option>
              </select>
            </div>

            {/* Address Input */}
            <div className="sm:col-span-6">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Recipient Wallet Address</span>
                <button
                  type="button"
                  onClick={handlePaste}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono"
                >
                  <ClipboardPaste className="w-3 h-3" />
                  <span>Paste</span>
                </button>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Paste 0x... address to verify before signing"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-[#060910] border border-white/10 rounded-xl pl-3.5 pr-10 py-3 text-xs font-mono text-white focus:outline-none focus:border-emerald-500 transition shadow-inner placeholder:text-slate-600"
                />
                {address && (
                  <button
                    type="button"
                    onClick={() => setAddress("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Amount Input */}
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Amount (Optional)</span>
                <span className="text-[10px] text-slate-500">Anomaly Check</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 50"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-[#060910] border border-white/10 rounded-xl px-3.5 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 transition shadow-inner placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Submit Action Button */}
          <button
            id="submit-verify-btn"
            type="submit"
            disabled={loading || !address.trim()}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm tracking-wide transition shadow-[0_0_30px_rgba(16,185,129,0.35)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform active:scale-[0.99]"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Evaluating Pure Deterministic Rules & Walrus Memory...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5 text-slate-950" />
                <span>Verify Recipient Address with Known</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-300 flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Verdict Result Card */}
      {result && (
        <div
          className={`glass-card rounded-[28px] p-6 sm:p-8 space-y-5 transition-all relative overflow-hidden ${
            result.verdict === "green"
              ? "border-emerald-500/40 glow-emerald"
              : result.verdict === "red"
              ? "border-rose-500/50 glow-crimson"
              : "border-amber-500/40 glow-amber"
          }`}
        >
          {/* Header Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              {result.verdict === "green" && (
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              )}
              {result.verdict === "red" && (
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400 shadow-lg pulse-beacon">
                  <ShieldAlert className="w-6 h-6" />
                </div>
              )}
              {result.verdict === "amber" && (
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              )}
              <div>
                <span
                  className={`text-base sm:text-lg font-black uppercase tracking-wider block ${
                    result.verdict === "green"
                      ? "text-emerald-400"
                      : result.verdict === "red"
                      ? "text-rose-400"
                      : "text-amber-400"
                  }`}
                >
                  {result.verdict === "green" && "SAFE — CONFIRMED SOVEREIGN PAYEE"}
                  {result.verdict === "red" && "ALERT — ADDRESS POISONING DETECTED"}
                  {result.verdict === "amber" && "WARNING — UNKNOWN COUNTERPARTY"}
                </span>
                <p className="text-xs text-slate-400 mt-0.5">
                  {result.verdict === "green" && "Address matches a confirmed payee anchored in your Walrus Memory."}
                  {result.verdict === "red" && "DO NOT PROCEED. Address is an attacker lookalike spoofing a legitimate payee."}
                  {result.verdict === "amber" && "No verified outgoing history found for this counterparty."}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
              {result.chain}
            </span>
          </div>

          {/* Explanation Banner */}
          <div className="p-4 rounded-2xl bg-[#060910]/80 border border-white/5">
            <p className="text-sm text-slate-100 font-medium leading-relaxed">
              {result.explanation}
            </p>
          </div>

          {/* Walrus Memory Recall Context */}
          {(result as any).memoryContext && (
            <div className="p-4 bg-emerald-950/25 border border-emerald-500/30 rounded-2xl space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-beacon" />
                  <span>Walrus Memory Recall (Decentralized Object)</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-500">Blob Confirmed</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {(result as any).memoryContext}
              </p>
            </div>
          )}

          {/* Lookalike Visual Diff Breakdown */}
          {result.imitates && (
            <div className="p-5 bg-[#060910]/90 border border-rose-500/30 rounded-2xl space-y-3.5">
              <div className="flex items-center justify-between text-xs font-bold text-rose-400 uppercase tracking-wider">
                <span>Visual Comparison (Attacker Scammed Middle Characters)</span>
                <span className="text-[10px] bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/25">
                  3+3 Invariant Triggered
                </span>
              </div>
              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
                  <div className="text-[11px] text-slate-400 font-semibold mb-1 flex items-center justify-between">
                    <span>Real Recipient ({result.imitates.label}):</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(result.imitates!.address)}
                      className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-[10px] font-mono"
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>Copy Real Address</span>
                    </button>
                  </div>
                  <div className="font-mono text-xs text-emerald-300 break-all select-all">
                    {result.imitates.address}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30">
                  <div className="text-[11px] text-rose-400 font-semibold mb-1">
                    Pasted Lookalike (Attacker Address):
                  </div>
                  <div>
                    {renderAddressWithHighlight(
                      result.displayAddress,
                      result.imitates.differingRanges
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Verified Memory Note & Rules */}
          <div className="pt-3 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
            <span>
              <strong className="text-slate-300">Engine Invariant:</strong> {result.reasons.join(", ")}
            </span>
            <span className="text-slate-500 font-mono">
              Evaluated at {new Date(result.checkedAt).toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}

      {/* Quick Demo Presets */}
      <div className="glass-panel border border-white/[0.08] rounded-[24px] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>Interactive Demo Scenarios</span>
          </h3>
          <span className="text-[11px] text-slate-500">Click any scenario to test instant verdict</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <button
            type="button"
            onClick={() =>
              applyPresetScenario(
                "sui",
                "0x565c34749525e936c4e43615f48c15f34031f18061d2f85df923032ca5864a38",
                "50"
              )
            }
            className="p-4 bg-[#060910] border border-white/[0.06] hover:border-emerald-500/40 rounded-2xl text-left space-y-1.5 transition group hover:shadow-lg"
          >
            <div className="font-bold text-emerald-400 flex items-center justify-between">
              <span>1. Real Payee</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
                SAFE
              </span>
            </div>
            <div className="font-mono text-slate-400 text-[11px] truncate">
              Ada Sister (50 SUI)
            </div>
            <div className="text-[10px] text-slate-500">Confirmed in Walrus</div>
          </button>

          <button
            type="button"
            onClick={() =>
              applyPresetScenario(
                "sui",
                "0x565efb05defb99e56e9377f0d5e48a93227b24842026a117bcaa6ec422295a38",
                ""
              )
            }
            className="p-4 bg-[#060910] border border-white/[0.06] hover:border-rose-500/40 rounded-2xl text-left space-y-1.5 transition group hover:shadow-lg"
          >
            <div className="font-bold text-rose-400 flex items-center justify-between">
              <span>2. Lookalike Scam</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/25">
                ALERT
              </span>
            </div>
            <div className="font-mono text-slate-400 text-[11px] truncate">
              0x565...a38 (Fake)
            </div>
            <div className="text-[10px] text-rose-400/80">3+3 Invariant Alert</div>
          </button>

          <button
            type="button"
            onClick={() =>
              applyPresetScenario(
                "sui",
                "0x565c34749525e936c4e43615f48c15f34031f18061d2f85df923032ca5864a38",
                "5000"
              )
            }
            className="p-4 bg-[#060910] border border-white/[0.06] hover:border-amber-500/40 rounded-2xl text-left space-y-1.5 transition group hover:shadow-lg"
          >
            <div className="font-bold text-amber-400 flex items-center justify-between">
              <span>3. Amount Anomaly</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/25">
                ANOMALY
              </span>
            </div>
            <div className="text-slate-400 text-[11px]">
              Ada (5,000 SUI send)
            </div>
            <div className="text-[10px] text-amber-400/80">10-90th Percentile Outlier</div>
          </button>

          <button
            type="button"
            onClick={() =>
              applyPresetScenario(
                "sui",
                "0x1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff",
                "100"
              )
            }
            className="p-4 bg-[#060910] border border-white/[0.06] hover:border-amber-500/40 rounded-2xl text-left space-y-1.5 transition group hover:shadow-lg"
          >
            <div className="font-bold text-slate-300 flex items-center justify-between">
              <span>4. Unknown Payee</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-slate-300 border border-white/10">
                WARN
              </span>
            </div>
            <div className="font-mono text-slate-400 text-[11px] truncate">
              0x111122...ffff
            </div>
            <div className="text-[10px] text-slate-500">Zero Outgoing History</div>
          </button>
        </div>
      </div>

      {/* Security Architecture Stepper */}
      <div className="p-4 rounded-2xl bg-[#060910]/60 border border-white/[0.05] flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">1</span>
          <span>Tatum Ingestion</span>
        </div>
        <span className="text-slate-600">→</span>
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">2</span>
          <span>Dust Quarantine</span>
        </div>
        <span className="text-slate-600">→</span>
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">3</span>
          <span>Walrus Recall</span>
        </div>
        <span className="text-slate-600">→</span>
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">4</span>
          <span>3+3 Lookalike Invariant</span>
        </div>
        <span className="text-slate-600">→</span>
        <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
          <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px]">5</span>
          <span>Sovereign Verdict</span>
        </div>
      </div>
    </div>
  );
}
