"use client";

import { useState, useEffect } from "react";
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
  Cpu,
  Database,
  RefreshCw,
  Eye,
} from "lucide-react";
import { CheckVerdictResult } from "@known/core";

const PRESET_REAL = {
  chain: "sui",
  address: "0x565c34749525e936c4e43615f48c15f34031f18061d2f85df923032ca5864a38",
  amount: "50",
  label: "Ada Sister (Real Payee)",
};

const PRESET_LOOKALIKE = {
  chain: "sui",
  address: "0x565efb05defb99e56e9377f0d5e48a93227b24842026a117bcaa6ec422295a38",
  amount: "50",
  label: "Address Poisoning Lookalike",
};

const PRESET_ANOMALY = {
  chain: "sui",
  address: "0x565c34749525e936c4e43615f48c15f34031f18061d2f85df923032ca5864a38",
  amount: "5000",
  label: "Statistical Amount Anomaly",
};

const PRESET_UNKNOWN = {
  chain: "sui",
  address: "0x1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff",
  amount: "100",
  label: "Unknown Fresh Counterparty",
};

export default function CheckPage() {
  const [chain, setChain] = useState<string>("sui");
  const [address, setAddress] = useState<string>(PRESET_REAL.address);
  const [amount, setAmount] = useState<string>(PRESET_REAL.amount);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<CheckVerdictResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeScenario, setActiveScenario] = useState<string>("real");

  // Core evaluation function that accepts direct arguments to avoid React state closure delays
  async function runVerification(targetChain: string, targetAddr: string, targetAmount?: string) {
    if (!targetAddr.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chain: targetChain,
          address: targetAddr.trim(),
          amountRaw: targetAmount && parseFloat(targetAmount) > 0
            ? BigInt(Math.floor(parseFloat(targetAmount) * 1e9)).toString()
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

  // Load default preset on mount so the user immediately sees the live interactive state
  useEffect(() => {
    runVerification(PRESET_REAL.chain, PRESET_REAL.address, PRESET_REAL.amount);
  }, []);

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setActiveScenario("custom");
    runVerification(chain, address, amount);
  }

  function handleSelectPreset(presetKey: "real" | "lookalike" | "anomaly" | "unknown") {
    setActiveScenario(presetKey);
    let p = PRESET_REAL;
    if (presetKey === "lookalike") p = PRESET_LOOKALIKE;
    else if (presetKey === "anomaly") p = PRESET_ANOMALY;
    else if (presetKey === "unknown") p = PRESET_UNKNOWN;

    setChain(p.chain);
    setAddress(p.address);
    setAmount(p.amount);
    runVerification(p.chain, p.address, p.amount);
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setAddress(text.trim());
        setActiveScenario("custom");
      }
    } catch {
      // Ignore if clipboard permission not granted
    }
  }

  function renderHighlightedAddress(
    targetAddr: string,
    ranges?: Array<{ start: number; end: number }>
  ) {
    if (!ranges || ranges.length === 0) {
      return <span className="font-mono break-all text-sm">{targetAddr}</span>;
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
      <span className="font-mono break-all text-xs sm:text-sm leading-relaxed block">
        <span className="text-emerald-400 font-bold bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/40">
          {prefix}
        </span>
        <span className="bg-rose-500/30 text-rose-200 font-bold px-1.5 py-0.5 rounded border border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.4)]">
          {middleDiff}
        </span>
        <span className="text-emerald-400 font-bold bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/40">
          {suffix}
        </span>
      </span>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner & Hero */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Pre-Flight Sovereign Payment Defense</span>
        </div>
        
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          Your transaction history can be poisoned. <br />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">
            Your memory can&apos;t.
          </span>
        </h1>
        
        <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
          Known extracts who you actually pay from verified history and anchors your confirmed payees
          into decentralized Walrus Memory. Test any address below before broadcasting transactions.
        </p>

        {/* Live System Invariants Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl glass-panel border border-white/10 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-slate-400">Security Core</div>
              <div className="text-xs font-bold text-white truncate">Zero-LLM Rules</div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl glass-panel border border-white/10 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
              <Database className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-slate-400">Walrus Memory</div>
              <div className="text-xs font-bold text-white truncate">Sui Ed25519 Signed</div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl glass-panel border border-white/10 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-slate-400">Tatum Data API</div>
              <div className="text-xs font-bold text-white truncate">Multi-Chain Ingest</div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl glass-panel border border-white/10 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-slate-400">Defense Engine</div>
              <div className="text-xs font-bold text-white truncate">3+3 Invariant Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Scenario Selector (One-Click Presets) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>Interactive Demo Scenarios (Click to test instantly)</span>
          </label>
          <span className="text-xs text-slate-400">Instant rule evaluation</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Preset 1: Real Payee */}
          <button
            type="button"
            onClick={() => handleSelectPreset("real")}
            className={`p-4 rounded-2xl border text-left space-y-1.5 transition-all duration-200 cursor-pointer ${
              activeScenario === "real"
                ? "bg-emerald-950/30 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.25)] scale-[1.02]"
                : "glass-card hover:border-emerald-500/30 hover:bg-emerald-950/15"
            }`}
          >
            <div className="font-bold text-emerald-400 flex items-center justify-between">
              <span>1. Real Payee</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-bold">
                SAFE
              </span>
            </div>
            <div className="font-mono text-slate-300 text-xs truncate">
              Ada Sister (50 SUI)
            </div>
            <div className="text-[11px] text-slate-400">
              Exact match in Walrus Memory
            </div>
          </button>

          {/* Preset 2: Lookalike Poison Attack */}
          <button
            type="button"
            onClick={() => handleSelectPreset("lookalike")}
            className={`p-4 rounded-2xl border text-left space-y-1.5 transition-all duration-200 cursor-pointer ${
              activeScenario === "lookalike"
                ? "bg-rose-950/40 border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.3)] scale-[1.02]"
                : "glass-card hover:border-rose-500/30 hover:bg-rose-950/15"
            }`}
          >
            <div className="font-bold text-rose-400 flex items-center justify-between">
              <span>2. Poison Attack</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold animate-pulse">
                ALERT
              </span>
            </div>
            <div className="font-mono text-slate-300 text-xs truncate">
              0x565...a38 (Lookalike)
            </div>
            <div className="text-[11px] text-rose-400 font-medium">
              3+3 Vanity Attacker Spoof
            </div>
          </button>

          {/* Preset 3: Amount Anomaly */}
          <button
            type="button"
            onClick={() => handleSelectPreset("anomaly")}
            className={`p-4 rounded-2xl border text-left space-y-1.5 transition-all duration-200 cursor-pointer ${
              activeScenario === "anomaly"
                ? "bg-amber-950/30 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.25)] scale-[1.02]"
                : "glass-card hover:border-amber-500/30 hover:bg-amber-950/15"
            }`}
          >
            <div className="font-bold text-amber-400 flex items-center justify-between">
              <span>3. Amount Anomaly</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold">
                ANOMALY
              </span>
            </div>
            <div className="font-mono text-slate-300 text-xs truncate">
              Ada (5,000 SUI vs 50)
            </div>
            <div className="text-[11px] text-slate-400">
              10th–90th percentile outlier
            </div>
          </button>

          {/* Preset 4: Unknown Payee */}
          <button
            type="button"
            onClick={() => handleSelectPreset("unknown")}
            className={`p-4 rounded-2xl border text-left space-y-1.5 transition-all duration-200 cursor-pointer ${
              activeScenario === "unknown"
                ? "bg-slate-800/60 border-slate-400/50 shadow-[0_0_20px_rgba(255,255,255,0.15)] scale-[1.02]"
                : "glass-card hover:border-slate-500/30 hover:bg-slate-800/30"
            }`}
          >
            <div className="font-bold text-slate-200 flex items-center justify-between">
              <span>4. Unknown Payee</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/15 font-bold">
                WARN
              </span>
            </div>
            <div className="font-mono text-slate-300 text-xs truncate">
              0x1111...ffff
            </div>
            <div className="text-[11px] text-slate-400">
              Zero outgoing transfer history
            </div>
          </button>
        </div>
      </div>

      {/* Main Check Input Card */}
      <div className="glass-surface rounded-[28px] p-6 sm:p-8 space-y-5">
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
            {/* Target Blockchain */}
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Network</span>
                <span className="text-[10px] font-mono text-slate-500">Tatum v4</span>
              </label>
              <select
                value={chain}
                onChange={(e) => {
                  setChain(e.target.value);
                  setActiveScenario("custom");
                }}
                className="w-full bg-[#080d1a] border border-white/10 rounded-xl px-3.5 py-3 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 transition shadow-inner cursor-pointer"
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
                <span>Recipient Address to Verify</span>
                <button
                  type="button"
                  onClick={handlePaste}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span>Paste Clipboard</span>
                </button>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Paste 0x... address"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    setActiveScenario("custom");
                  }}
                  className="w-full bg-[#080d1a] border border-white/10 rounded-xl pl-3.5 pr-10 py-3 text-xs font-mono text-white focus:outline-none focus:border-emerald-500 transition shadow-inner placeholder:text-slate-600"
                />
                {address && (
                  <button
                    type="button"
                    onClick={() => {
                      setAddress("");
                      setActiveScenario("custom");
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-white cursor-pointer"
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
                onChange={(e) => {
                  setAmount(e.target.value);
                  setActiveScenario("custom");
                }}
                className="w-full bg-[#080d1a] border border-white/10 rounded-xl px-3.5 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 transition shadow-inner placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <button
            type="submit"
            disabled={loading || !address.trim()}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm tracking-wide transition-all shadow-[0_0_30px_rgba(16,185,129,0.35)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform active:scale-[0.98] cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 text-slate-950 animate-spin" />
                <span>Evaluating Invariants & Walrus Memory...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5 text-slate-950" />
                <span>Verify Recipient Address with Known</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Dynamic Verdict Result Card */}
      {result && (
        <div
          className={`rounded-[28px] p-6 sm:p-8 space-y-6 transition-all relative overflow-hidden border ${
            result.verdict === "green"
              ? "bg-emerald-950/20 glow-emerald"
              : result.verdict === "red"
              ? "bg-rose-950/30 glow-rose"
              : "bg-amber-950/20 glow-amber"
          }`}
        >
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {result.verdict === "green" && (
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.4)] shrink-0">
                  <ShieldCheck className="w-8 h-8" />
                </div>
              )}
              {result.verdict === "red" && (
                <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/60 flex items-center justify-center text-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.5)] shrink-0 pulse-beacon">
                  <ShieldAlert className="w-8 h-8" />
                </div>
              )}
              {result.verdict === "amber" && (
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.35)] shrink-0">
                  <AlertTriangle className="w-8 h-8" />
                </div>
              )}

              <div>
                <span
                  className={`text-lg sm:text-xl font-black uppercase tracking-wider block ${
                    result.verdict === "green"
                      ? "text-emerald-400"
                      : result.verdict === "red"
                      ? "text-rose-400"
                      : "text-amber-400"
                  }`}
                >
                  {result.verdict === "green" && "SAFE — CONFIRMED SOVEREIGN PAYEE"}
                  {result.verdict === "red" && "ALERT — ADDRESS POISONING ATTACK DETECTED"}
                  {result.verdict === "amber" && "WARNING — UNKNOWN COUNTERPARTY"}
                </span>
                <p className="text-xs text-slate-300 mt-1">
                  {result.verdict === "green" && "Exact character-by-character match against confirmed Walrus Memory."}
                  {result.verdict === "red" && "DO NOT BROADCAST. Address is an attacker lookalike spoofing your real payee."}
                  {result.verdict === "amber" && "No verified outgoing history found for this counterparty."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <span className="text-xs font-mono font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-slate-200">
                {result.chain}
              </span>
            </div>
          </div>

          {/* Explanation Narrative Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#060912]/80 border border-white/10">
            <p className="text-sm text-slate-100 font-medium leading-relaxed">
              {result.explanation}
            </p>
          </div>

          {/* Walrus Memory Recall Details */}
          {(result as any).matchedPayee && (
            <div className="p-4 sm:p-5 bg-emerald-950/25 border border-emerald-500/30 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 pulse-beacon" />
                  <span>Walrus Memory Recall (Decentralized Context)</span>
                </div>
                <span className="font-mono text-emerald-300">Anchored Object</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Payee: <strong className="text-white">{(result as any).matchedPayee.label}</strong> • Paid {(result as any).matchedPayee.sendCount} times • 
                Typical range: {((Number((result as any).matchedPayee.typicalLowRaw || 0)) / 1e9).toFixed(0)} – {((Number((result as any).matchedPayee.typicalHighRaw || 0)) / 1e9).toFixed(0)} SUI.
              </p>
            </div>
          )}

          {/* Visual Diff Breakdown (Shown on Poisoning Attack) */}
          {result.imitates && (
            <div className="p-5 sm:p-6 bg-[#080d1a]/95 border border-rose-500/40 rounded-2xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between text-xs font-bold text-rose-400 uppercase tracking-wider">
                <span>Visual Comparison (Attacker Scammed Middle Hex Characters)</span>
                <span className="text-[10px] bg-rose-500/20 px-2.5 py-0.5 rounded-full border border-rose-500/40 font-bold">
                  3+3 Invariant Triggered
                </span>
              </div>

              <div className="space-y-3">
                {/* Real Address */}
                <div className="p-3.5 rounded-xl bg-slate-900/70 border border-white/10">
                  <div className="text-xs text-slate-400 font-semibold mb-1.5 flex items-center justify-between">
                    <span>Legitimate Recipient ({result.imitates.label}):</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(result.imitates!.address)}
                      className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 text-xs font-mono font-semibold cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? "Copied!" : "Copy Real Address"}</span>
                    </button>
                  </div>
                  <div className="font-mono text-xs sm:text-sm text-emerald-300 break-all select-all">
                    {result.imitates.address}
                  </div>
                </div>

                {/* Poisoned Lookalike Address */}
                <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/40">
                  <div className="text-xs text-rose-300 font-semibold mb-1.5">
                    Attacker Lookalike (Pasted into Transaction):
                  </div>
                  <div>
                    {renderHighlightedAddress(
                      result.displayAddress,
                      result.imitates.differingRanges
                    )}
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 leading-relaxed">
                Notice how the attacker generated an address with matching green prefix (<code className="text-emerald-300">0x565</code>) and suffix (<code className="text-emerald-300">a38</code>) to trick human visual inspection, but the entire middle section is their own wallet.
              </div>
            </div>
          )}

          {/* Footer Rule Attribution */}
          <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
            <span>
              <strong className="text-slate-200">Rule Triggered:</strong> {result.reasons.join(", ")}
            </span>
            <span className="font-mono text-slate-500">
              Evaluated at {new Date(result.checkedAt).toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}

      {/* Security Engine Stepper */}
      <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>Known Pre-Flight Defense Pipeline</span>
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
          <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
            <span className="text-[10px] font-mono text-emerald-400 font-bold block">STEP 1</span>
            <div className="font-bold text-white">Tatum Ingestion</div>
            <p className="text-[11px] text-slate-400">Pulls historical transfers via Tatum Data API.</p>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
            <span className="text-[10px] font-mono text-emerald-400 font-bold block">STEP 2</span>
            <div className="font-bold text-white">Dust Quarantine</div>
            <p className="text-[11px] text-slate-400">Inbound-only zero-value txs isolated from payees.</p>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
            <span className="text-[10px] font-mono text-emerald-400 font-bold block">STEP 3</span>
            <div className="font-bold text-white">Walrus Memory</div>
            <p className="text-[11px] text-slate-400">Confirmed payees queried from Walrus blobs.</p>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
            <span className="text-[10px] font-mono text-rose-400 font-bold block">STEP 4</span>
            <div className="font-bold text-white">3+3 Invariant</div>
            <p className="text-[11px] text-slate-400">Catches prefix & suffix lookalike scams.</p>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
            <span className="text-[10px] font-mono text-emerald-400 font-bold block">STEP 5</span>
            <div className="font-bold text-white">Deterministic Verdict</div>
            <p className="text-[11px] text-slate-400">Clear Green / Red / Amber verdict issued.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
