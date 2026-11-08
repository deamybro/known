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
  Radio,
  ExternalLink,
} from "lucide-react";
import { CheckVerdictResult } from "@known/core";

const PRESET_REAL = {
  chain: "sui",
  address: "0x565c34749525e936c4e43615f48c15f34031f18061d2f85df923032ca5864a38",
  amount: "50",
  label: "Ada Sister (Legitimate Payee)",
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

  // Core evaluation function that evaluates immediately with direct parameters
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

  // Load default preset on initial mount
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
      // Ignore if permission denied
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
        <span className="text-[#00f5d4] font-bold bg-[#00f5d4]/20 px-1.5 py-0.5 rounded border border-[#00f5d4]/40">
          {prefix}
        </span>
        <span className="bg-[#ff3366]/30 text-rose-200 font-bold px-1.5 py-0.5 rounded border border-[#ff3366]/60 shadow-[0_0_15px_rgba(255,51,102,0.5)]">
          {middleDiff}
        </span>
        <span className="text-[#00f5d4] font-bold bg-[#00f5d4]/20 px-1.5 py-0.5 rounded border border-[#00f5d4]/40">
          {suffix}
        </span>
      </span>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Walrus Hero Section */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00f5d4]/10 border border-[#00f5d4]/30 text-xs font-bold text-[#00f5d4] shadow-[0_0_20px_rgba(0,245,212,0.25)]">
          <span className="text-sm">🦭</span>
          <span>Walrus Decentralized Memory Protocol</span>
          <span className="text-slate-400">•</span>
          <span className="text-sky-300">Tatum Multi-Chain Gateway</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          Your transaction history can be poisoned. <br />
          <span className="bg-gradient-to-r from-[#00f5d4] via-[#2dd4bf] to-[#38bdf8] bg-clip-text text-transparent">
            Your memory can&apos;t.
          </span>
        </h1>

        <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
          Known learns who you actually pay from verified history and anchors your confirmed payees into
          immutable Walrus blobs. Test any recipient address below before signing transfers.
        </p>

        {/* Live System Invariants Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="walrus-panel p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#00f5d4]/15 border border-[#00f5d4]/30 flex items-center justify-center text-[#00f5d4] shrink-0 font-bold">
              🛡️
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-slate-400">Security Core</div>
              <div className="text-xs font-bold text-white truncate">Pure Zero-LLM</div>
            </div>
          </div>

          <div className="walrus-panel p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0 font-bold">
              🦭
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-slate-400">Walrus Memory</div>
              <div className="text-xs font-bold text-white truncate">Sui Ed25519 Signed</div>
            </div>
          </div>

          <div className="walrus-panel p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 font-bold">
              ⚡
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-slate-400">Tatum Sui Gateway</div>
              <div className="text-xs font-bold text-white truncate">Checkpoint #342M+</div>
            </div>
          </div>

          <div className="walrus-panel p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 font-bold">
              🚫
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-slate-400">Dust Quarantine</div>
              <div className="text-xs font-bold text-white truncate">3+3 Invariant Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Scenario Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#00f5d4]" />
            <span>Interactive Threat Scenarios (Click to test instantly)</span>
          </label>
          <span className="text-xs text-slate-400">Deterministic Invariants</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Preset 1: Real Payee */}
          <button
            type="button"
            onClick={() => handleSelectPreset("real")}
            className={`p-4 rounded-2xl border text-left space-y-1.5 transition-all duration-200 cursor-pointer ${
              activeScenario === "real"
                ? "bg-[#00f5d4]/15 border-[#00f5d4] shadow-[0_0_25px_rgba(0,245,212,0.3)] scale-[1.02]"
                : "walrus-panel hover:border-[#00f5d4]/40 hover:bg-[#00f5d4]/5"
            }`}
          >
            <div className="font-bold text-[#00f5d4] flex items-center justify-between">
              <span>1. Real Payee</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00f5d4]/20 text-[#00f5d4] border border-[#00f5d4]/40 font-bold">
                SAFE
              </span>
            </div>
            <div className="font-mono text-slate-200 text-xs truncate">
              Ada Sister (50 SUI)
            </div>
            <div className="text-[11px] text-slate-400">
              Walrus confirmed memory
            </div>
          </button>

          {/* Preset 2: Lookalike Poison Attack */}
          <button
            type="button"
            onClick={() => handleSelectPreset("lookalike")}
            className={`p-4 rounded-2xl border text-left space-y-1.5 transition-all duration-200 cursor-pointer ${
              activeScenario === "lookalike"
                ? "bg-[#ff3366]/20 border-[#ff3366] shadow-[0_0_30px_rgba(255,51,102,0.4)] scale-[1.02]"
                : "walrus-panel hover:border-[#ff3366]/40 hover:bg-[#ff3366]/5"
            }`}
          >
            <div className="font-bold text-rose-400 flex items-center justify-between">
              <span>2. Poison Attack</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#ff3366]/25 text-rose-300 border border-[#ff3366]/50 font-bold animate-pulse">
                CRITICAL
              </span>
            </div>
            <div className="font-mono text-slate-200 text-xs truncate">
              0x565...a38 (Vanity Spoof)
            </div>
            <div className="text-[11px] text-rose-400 font-semibold">
              3+3 Matching Attacker Hex
            </div>
          </button>

          {/* Preset 3: Amount Anomaly */}
          <button
            type="button"
            onClick={() => handleSelectPreset("anomaly")}
            className={`p-4 rounded-2xl border text-left space-y-1.5 transition-all duration-200 cursor-pointer ${
              activeScenario === "anomaly"
                ? "bg-amber-500/20 border-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.3)] scale-[1.02]"
                : "walrus-panel hover:border-amber-500/40 hover:bg-amber-500/5"
            }`}
          >
            <div className="font-bold text-amber-400 flex items-center justify-between">
              <span>3. Amount Anomaly</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                OUTLIER
              </span>
            </div>
            <div className="font-mono text-slate-200 text-xs truncate">
              Ada (5,000 SUI vs 50)
            </div>
            <div className="text-[11px] text-slate-400">
              10th–90th percentile outlier
            </div>
          </button>

          {/* Preset 4: Unknown Recipient */}
          <button
            type="button"
            onClick={() => handleSelectPreset("unknown")}
            className={`p-4 rounded-2xl border text-left space-y-1.5 transition-all duration-200 cursor-pointer ${
              activeScenario === "unknown"
                ? "bg-slate-800 border-slate-400 shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-[1.02]"
                : "walrus-panel hover:border-slate-500/40 hover:bg-slate-800/40"
            }`}
          >
            <div className="font-bold text-slate-200 flex items-center justify-between">
              <span>4. Unknown Recipient</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/20 font-bold">
                WARN
              </span>
            </div>
            <div className="font-mono text-slate-200 text-xs truncate">
              0x1111...ffff
            </div>
            <div className="text-[11px] text-slate-400">
              Zero historical outgoing sends
            </div>
          </button>
        </div>
      </div>

      {/* Main Pre-Flight Radar Card */}
      <div className="walrus-card p-6 sm:p-8 space-y-5">
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
            {/* Target Blockchain */}
            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Network</span>
                <span className="text-[10px] font-mono text-sky-400">Tatum API</span>
              </label>
              <select
                value={chain}
                onChange={(e) => {
                  setChain(e.target.value);
                  setActiveScenario("custom");
                }}
                className="w-full bg-[#050c18] border border-white/15 rounded-xl px-3.5 py-3 text-xs font-semibold text-white focus:outline-none focus:border-[#00f5d4] transition shadow-inner cursor-pointer"
              >
                <option value="sui">Sui Mainnet</option>
                <option value="ethereum">Ethereum</option>
                <option value="bsc">BNB Chain</option>
                <option value="base">Base</option>
                <option value="polygon">Polygon</option>
              </select>
            </div>

            {/* Recipient Address */}
            <div className="sm:col-span-6">
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Recipient Address to Verify</span>
                <button
                  type="button"
                  onClick={handlePaste}
                  className="text-xs text-[#00f5d4] hover:underline flex items-center gap-1 font-bold cursor-pointer"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span>Paste</span>
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
                  className="w-full bg-[#050c18] border border-white/15 rounded-xl pl-3.5 pr-10 py-3 text-xs font-mono text-white focus:outline-none focus:border-[#00f5d4] transition shadow-inner placeholder:text-slate-600"
                />
                {address && (
                  <button
                    type="button"
                    onClick={() => {
                      setAddress("");
                      setActiveScenario("custom");
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Amount */}
            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Amount (Optional)</span>
                <span className="text-[10px] text-slate-400">Anomaly Check</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 50"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setActiveScenario("custom");
                }}
                className="w-full bg-[#050c18] border border-white/15 rounded-xl px-3.5 py-3 text-xs text-white focus:outline-none focus:border-[#00f5d4] transition shadow-inner placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Evaluate Button */}
          <button
            type="submit"
            disabled={loading || !address.trim()}
            className="w-full py-4 px-6 btn-walrus-primary text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Evaluating Invariants Against Walrus Memory...</span>
              </>
            ) : (
              <>
                <Radio className="w-5 h-5 text-slate-950" />
                <span>Execute Pre-Flight Address Verification</span>
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

      {/* Bioluminescent Verdict Result Reveal */}
      {result && (
        <div
          className={`walrus-card p-6 sm:p-8 space-y-6 transition-all relative overflow-hidden ${
            result.verdict === "green"
              ? "glow-mint bg-emerald-950/20"
              : result.verdict === "red"
              ? "glow-crimson bg-rose-950/30"
              : "glow-amber bg-amber-950/20"
          }`}
        >
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {result.verdict === "green" && (
                <div className="w-14 h-14 rounded-2xl bg-[#00f5d4]/20 border border-[#00f5d4]/40 flex items-center justify-center text-[#00f5d4] shadow-[0_0_25px_rgba(0,245,212,0.5)] shrink-0">
                  <ShieldCheck className="w-8 h-8" />
                </div>
              )}
              {result.verdict === "red" && (
                <div className="w-14 h-14 rounded-2xl bg-[#ff3366]/20 border border-[#ff3366]/60 flex items-center justify-center text-rose-400 shadow-[0_0_30px_rgba(255,51,102,0.6)] shrink-0 pulse-beacon">
                  <ShieldAlert className="w-8 h-8" />
                </div>
              )}
              {result.verdict === "amber" && (
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.4)] shrink-0">
                  <AlertTriangle className="w-8 h-8" />
                </div>
              )}

              <div>
                <span
                  className={`text-lg sm:text-xl font-black uppercase tracking-wider block ${
                    result.verdict === "green"
                      ? "text-[#00f5d4]"
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
                  {result.verdict === "green" && "Exact match with confirmed payee anchored in Walrus Memory."}
                  {result.verdict === "red" && "DO NOT PROCEED. Address is an attacker lookalike spoofing your real payee."}
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
          <div className="p-4 sm:p-5 rounded-2xl bg-[#040812]/90 border border-white/10">
            <p className="text-sm text-slate-100 font-medium leading-relaxed">
              {result.explanation}
            </p>
          </div>

          {/* Walrus Memory Object Recall Box */}
          {(result as any).matchedPayee && (
            <div className="p-4 sm:p-5 bg-[#00f5d4]/10 border border-[#00f5d4]/30 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#00f5d4]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00f5d4] pulse-beacon" />
                  <span>Walrus Memory Blob Recall (Decentralized Object)</span>
                </div>
                <span className="font-mono text-[#00f5d4]">CID: 0x965a8406f52...</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Payee: <strong className="text-white">{(result as any).matchedPayee.label}</strong> • Paid {(result as any).matchedPayee.sendCount} times • 
                Typical range: {((Number((result as any).matchedPayee.typicalLowRaw || 0)) / 1e9).toFixed(0)} – {((Number((result as any).matchedPayee.typicalHighRaw || 0)) / 1e9).toFixed(0)} SUI.
              </p>
            </div>
          )}

          {/* Visual Diff Breakdown (Shown for Lookalike Attack) */}
          {result.imitates && (
            <div className="p-5 sm:p-6 bg-[#080d1a]/95 border border-[#ff3366]/40 rounded-2xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between text-xs font-bold text-rose-400 uppercase tracking-wider">
                <span>Visual Diff Comparison (Attacker Scammed Middle Hex Characters)</span>
                <span className="text-[10px] bg-[#ff3366]/20 px-2.5 py-0.5 rounded-full border border-[#ff3366]/40 font-bold">
                  3+3 Invariant Triggered
                </span>
              </div>

              <div className="space-y-3">
                {/* Real Address */}
                <div className="p-3.5 rounded-xl bg-slate-900/70 border border-white/10">
                  <div className="text-xs text-slate-400 font-semibold mb-1.5 flex items-center justify-between">
                    <span>Legitimate Payee ({result.imitates.label}):</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(result.imitates!.address)}
                      className="text-[#00f5d4] hover:underline flex items-center gap-1.5 text-xs font-mono font-semibold cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? "Copied!" : "Copy Real Address"}</span>
                    </button>
                  </div>
                  <div className="font-mono text-xs sm:text-sm text-[#00f5d4] break-all select-all">
                    {result.imitates.address}
                  </div>
                </div>

                {/* Poisoned Lookalike Address */}
                <div className="p-3.5 rounded-xl bg-rose-950/30 border border-[#ff3366]/40">
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

              <div className="text-xs text-slate-300 leading-relaxed">
                The attacker vanity-grinded matching prefix (<code className="text-[#00f5d4] font-bold">0x565</code>) and suffix (<code className="text-[#00f5d4] font-bold">a38</code>) to fool human eyes, but the middle 58 characters steal your funds. Known quarantines the dust and blocks the payment.
              </div>
            </div>
          )}

          {/* Footer Rule Attribution */}
          <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
            <span>
              <strong className="text-slate-200">Security Invariant:</strong> {result.reasons.join(", ")}
            </span>
            <span className="font-mono text-slate-400">
              Evaluated at {new Date(result.checkedAt).toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}

      {/* Security Architecture Stepper */}
      <div className="walrus-panel p-5 space-y-3">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#00f5d4]" />
          <span>Known Pre-Flight Defense Pipeline</span>
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-xs">
          <div className="p-3 rounded-xl bg-[#040812] border border-white/5 space-y-1">
            <span className="text-[10px] font-mono text-[#00f5d4] font-bold block">STEP 1</span>
            <div className="font-bold text-white">Tatum Ingest</div>
            <p className="text-[11px] text-slate-400">Historical transfers pulled via Tatum Data API.</p>
          </div>

          <div className="p-3 rounded-xl bg-[#040812] border border-white/5 space-y-1">
            <span className="text-[10px] font-mono text-[#00f5d4] font-bold block">STEP 2</span>
            <div className="font-bold text-white">Dust Quarantine</div>
            <p className="text-[11px] text-slate-400">Zero-value inbound scams isolated.</p>
          </div>

          <div className="p-3 rounded-xl bg-[#040812] border border-white/5 space-y-1">
            <span className="text-[10px] font-mono text-[#00f5d4] font-bold block">STEP 3</span>
            <div className="font-bold text-white">Walrus Recall</div>
            <p className="text-[11px] text-slate-400">Confirmed payees queried from Walrus blobs.</p>
          </div>

          <div className="p-3 rounded-xl bg-[#040812] border border-white/5 space-y-1">
            <span className="text-[10px] font-mono text-rose-400 font-bold block">STEP 4</span>
            <div className="font-bold text-white">3+3 Invariant</div>
            <p className="text-[11px] text-slate-400">Prefix/suffix vanity lookalikes detected.</p>
          </div>

          <div className="p-3 rounded-xl bg-[#040812] border border-white/5 space-y-1">
            <span className="text-[10px] font-mono text-[#00f5d4] font-bold block">STEP 5</span>
            <div className="font-bold text-white">Deterministic Verdict</div>
            <p className="text-[11px] text-slate-400">Signed Green / Red / Amber verdict issued.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
