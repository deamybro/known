"use client";

import { useState, useEffect } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Copy,
  Check,
  Zap,
  Lock,
  Database,
  Terminal,
  Cpu,
  Layers,
  ClipboardPaste,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Radio,
  CheckCircle2,
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

export default function HomePage() {
  const [chain, setChain] = useState<string>("sui");
  const [address, setAddress] = useState<string>(PRESET_REAL.address);
  const [amount, setAmount] = useState<string>(PRESET_REAL.amount);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<CheckVerdictResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedCli, setCopiedCli] = useState<boolean>(false);
  
  // Navigation inside the Terminal Card
  const [terminalMode, setTerminalMode] = useState<"radar" | "agent">("radar");
  const [agentTab, setAgentTab] = useState<"claude" | "codex" | "antigravity" | "cursor">("claude");
  const [activeScenario, setActiveScenario] = useState<"real" | "lookalike" | "anomaly" | "unknown" | "custom">("real");

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

  useEffect(() => {
    runVerification(PRESET_REAL.chain, PRESET_REAL.address, PRESET_REAL.amount);
  }, []);

  function handleSelectPreset(presetKey: "real" | "lookalike" | "anomaly" | "unknown") {
    setActiveScenario(presetKey);
    setTerminalMode("radar");
    let p = PRESET_REAL;
    if (presetKey === "lookalike") p = PRESET_LOOKALIKE;
    else if (presetKey === "anomaly") p = PRESET_ANOMALY;
    else if (presetKey === "unknown") p = PRESET_UNKNOWN;

    setChain(p.chain);
    setAddress(p.address);
    setAmount(p.amount);
    runVerification(p.chain, p.address, p.amount);
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setActiveScenario("custom");
    runVerification(chain, address, amount);
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleCopyCli(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
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
      return <span className="font-mono break-all text-xs sm:text-sm text-slate-200">{targetAddr}</span>;
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
        <span className="text-emerald-400 font-bold bg-emerald-950/60 px-1 py-0.5 rounded border border-emerald-500/40">
          {prefix}
        </span>
        <span className="bg-rose-950/80 text-rose-300 font-bold px-1.5 py-0.5 rounded border border-rose-500/70 shadow-[0_0_15px_rgba(244,63,94,0.4)]">
          {middleDiff}
        </span>
        <span className="text-emerald-400 font-bold bg-emerald-950/60 px-1 py-0.5 rounded border border-emerald-500/40">
          {suffix}
        </span>
      </span>
    );
  }

  const agentSnippets = {
    claude: `claude plugin marketplace add mystenlabs/walrus-memory\nclaude plugin install known@walrus-memory -s user\nclaude plugin list`,
    codex: `npm install -g @known/memory-plugin\nknown-agent init --runtime codex --chain sui\nknown-agent preflight --daemon`,
    antigravity: `agy skill add @known/walrus-payment-defense\nagy config set walrus.network testnet\nagy run payment-audit`,
    cursor: `curl -sSL https://get.known.network/cursor | bash\ncode --install-extension known-preflight-defense`,
  };

  return (
    <div className="pt-6 sm:pt-12 pb-16">
      
      {/* 2-Column Split Hero matching Walrus Memory layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-start">
        
        {/* Left Column: Headline, Pill Buttons, Trust Strip */}
        <div className="lg:col-span-5 flex flex-col justify-center pt-2 sm:pt-6 space-y-8">
          
          <div className="space-y-4">
            <h1 className="text-5xl sm:text-6xl font-normal tracking-tight text-white leading-[1.08]">
              Sign in to <br />
              start verifying
            </h1>
            
            <p className="text-slate-400 text-base sm:text-lg leading-relaxed max-w-md font-normal">
              Portable payment memory for your agents and wallets, across apps and workflows.
            </p>
          </div>

          {/* Action Pill Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleSelectPreset("lookalike")}
              className="btn-pill btn-pill-primary"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>CONTINUE WITH GOOGLE</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset("real")}
              className="btn-pill"
            >
              <span>CONNECT WALLET</span>
            </button>
          </div>

          {/* Micro Legal & Assurance Line */}
          <p className="text-xs text-slate-500 font-normal">
            By continuing, you agree to our{" "}
            <a href="#terms" className="text-slate-400 hover:text-white underline underline-offset-2">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#privacy" className="text-slate-400 hover:text-white underline underline-offset-2">
              Privacy Policy
            </a>
          </p>

          {/* Trusted Partner Strip matching reference */}
          <div className="pt-10 space-y-4">
            <p className="text-xs text-slate-400 font-normal">
              Trusted by teams building <strong className="text-white font-semibold">reliable AI systems</strong>
            </p>

            <div className="flex flex-wrap items-center gap-6 sm:gap-8 opacity-80 hover:opacity-100 transition-opacity">
              {/* Allium */}
              <div className="flex items-center gap-2 text-slate-300 font-semibold tracking-tight text-sm">
                <svg className="w-5 h-5 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="6" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
                <span>Allium</span>
              </div>

              {/* inflectiv */}
              <div className="flex items-center gap-1.5 text-slate-300 font-medium tracking-tight text-sm">
                <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                <span>inflectiv<span className="text-[10px] align-super">™</span></span>
              </div>

              {/* TALUS */}
              <div className="text-slate-300 font-bold tracking-widest text-sm">
                TALUS
              </div>

              {/* TATUM */}
              <div className="flex items-center gap-1.5 text-slate-300 font-bold tracking-tight text-sm">
                <span className="font-mono text-base font-black">TT</span>
                <span>TATUM</span>
              </div>

              {/* WALRUS */}
              <div className="flex items-center gap-1.5 text-slate-300 font-bold tracking-wider text-sm">
                <span className="text-base">🦭</span>
                <span>WALRUS</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Floating Terminal Card + 3D Glass Tiles */}
        <div className="lg:col-span-7 relative">
          
          {/* Subtle 3D Wireframe Cube in Top Right */}
          <div className="wireframe-cube absolute -top-8 -right-4 z-0 pointer-events-none opacity-40 hidden md:block">
            <svg width="70" height="70" viewBox="0 0 100 100" fill="none" stroke="rgba(168, 85, 247, 0.7)" strokeWidth="1.5">
              <path d="M50 15 L85 35 L85 75 L50 95 L15 75 L15 35 Z" />
              <path d="M50 15 L50 95" />
              <path d="M50 55 L85 35" />
              <path d="M50 55 L15 35" />
            </svg>
          </div>

          {/* Floating Refractive Glass Gem 1 (Bottom Left) */}
          <div className="glass-gem-1 absolute -bottom-7 -left-7 z-20 pointer-events-none hidden sm:flex">
            <div className="gem-inner-diamond" />
          </div>

          {/* Floating Refractive Glass Gem 2 (Bottom Right) */}
          <div className="glass-gem-2 absolute -bottom-8 -right-6 z-20 pointer-events-none hidden sm:flex">
            <div className="gem-inner-diamond" />
          </div>

          {/* Main Dark Terminal Window */}
          <div className="card-terminal p-6 sm:p-7 relative z-10 space-y-6">
            
            {/* Top 2 Option Cards matching reference */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Connect an Agent */}
              <button
                type="button"
                onClick={() => setTerminalMode("agent")}
                className={`card-terminal-sub p-4 text-left flex flex-col justify-between ${
                  terminalMode === "agent" ? "active" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-sm font-semibold text-white">Connect an agent</span>
                  <div className="flex items-center gap-1 opacity-70">
                    <span className="text-xs">⚡</span>
                    <span className="text-xs">🤖</span>
                    <span className="text-xs">✨</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-2 font-normal leading-relaxed">
                  Add Known Memory to Claude Code, Codex, Antigravity, and Cursor.
                </p>
              </button>

              {/* Option 2: Live Radar Pre-flight */}
              <button
                type="button"
                onClick={() => setTerminalMode("radar")}
                className={`card-terminal-sub p-4 text-left flex flex-col justify-between ${
                  terminalMode === "radar" ? "active" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-sm font-semibold text-white">Pre-flight Radar</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Active
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2 font-normal leading-relaxed">
                  Evaluate live addresses against 3+3 poison invariants and Tatum APIs.
                </p>
              </button>
            </div>

            {/* Sub-Pills Bar */}
            {terminalMode === "agent" ? (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-white/[0.06] pt-1">
                <button
                  type="button"
                  onClick={() => setAgentTab("claude")}
                  className={`badge-pill ${agentTab === "claude" ? "active" : ""}`}
                >
                  <span>• CLAUDE CODE</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAgentTab("codex")}
                  className={`badge-pill ${agentTab === "codex" ? "active" : ""}`}
                >
                  <span>CODEX</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAgentTab("antigravity")}
                  className={`badge-pill ${agentTab === "antigravity" ? "active" : ""}`}
                >
                  <span>ANTIGRAVITY</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAgentTab("cursor")}
                  className={`badge-pill ${agentTab === "cursor" ? "active" : ""}`}
                >
                  <span>CURSOR</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 pt-1">
                <div className="flex items-center gap-2 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => handleSelectPreset("real")}
                    className={`badge-pill ${activeScenario === "real" ? "active" : ""}`}
                  >
                    <span>1. Real Payee</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPreset("lookalike")}
                    className={`badge-pill ${activeScenario === "lookalike" ? "active" : ""}`}
                  >
                    <span>2. Poison Attack</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPreset("anomaly")}
                    className={`badge-pill ${activeScenario === "anomaly" ? "active" : ""}`}
                  >
                    <span>3. Amount Anomaly</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPreset("unknown")}
                    className={`badge-pill ${activeScenario === "unknown" ? "active" : ""}`}
                  >
                    <span>4. Unknown</span>
                  </button>
                </div>
              </div>
            )}

            {/* Body of Terminal based on selection */}
            {terminalMode === "agent" ? (
              <div className="space-y-4 pt-1">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white capitalize">
                      {agentTab === "claude" ? "Claude Code" : agentTab}
                    </h3>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-semibold text-slate-300">01 Install the plugin</div>
                  <div className="text-xs text-slate-400 font-normal">
                    Add Walrus Payment Defense to {agentTab === "claude" ? "Claude Code" : agentTab}:
                  </div>
                </div>

                {/* Code CLI Snippet Box */}
                <div className="relative rounded-xl bg-[#04060b] border border-white/[0.08] p-4 font-mono text-xs text-slate-300">
                  <button
                    type="button"
                    onClick={() => handleCopyCli(agentSnippets[agentTab])}
                    className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-white/[0.08] text-slate-400 hover:text-white transition"
                    title="Copy command"
                  >
                    {copiedCli ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <pre className="overflow-x-auto pr-10 leading-relaxed font-mono text-[12px]">
                    {agentSnippets[agentTab]}
                  </pre>
                </div>

                <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 beacon-dot" />
                    <span>Hooks into pre-flight transfer calls automatically</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setTerminalMode("radar")}
                    className="text-white hover:underline flex items-center gap-1"
                  >
                    <span>Test Radar Now</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : (
              /* Pre-flight Radar Interactive Terminal */
              <div className="space-y-5">
                
                {/* Address Input Form */}
                <form onSubmit={handleFormSubmit} className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <span>Recipient Counterparty Address</span>
                    </label>
                    <button
                      type="button"
                      onClick={handlePaste}
                      className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                    >
                      <ClipboardPaste className="w-3 h-3" />
                      <span>Paste</span>
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value);
                        setActiveScenario("custom");
                      }}
                      placeholder="0x..."
                      className="w-full rounded-xl bg-[#030509] border border-white/[0.1] px-3.5 py-2.5 font-mono text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-white/30 transition shadow-inner"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        value={amount}
                        onChange={(e) => {
                          setAmount(e.target.value);
                          setActiveScenario("custom");
                        }}
                        placeholder="Amount (SUI)"
                        className="w-full rounded-xl bg-[#030509] border border-white/[0.1] px-3 py-2 font-mono text-xs text-white placeholder-slate-600 focus:outline-none focus:border-white/30 transition"
                      />
                    </div>
                    <div className="sm:col-span-7">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-pill btn-pill-primary py-2 text-xs"
                      >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full border-2 border-slate-900 border-t-transparent animate-spin" />
                            <span>EVALUATING INVARIANTS...</span>
                          </span>
                        ) : (
                          <span>RUN PRE-FLIGHT VERDICT</span>
                        )}
                      </button>
                    </div>
                  </div>
                </form>

                {/* Error Banner if any */}
                {error && (
                  <div className="rounded-xl bg-rose-950/30 border border-rose-500/30 p-3 text-xs text-rose-300">
                    {error}
                  </div>
                )}

                {/* Live Verdict Reveal Card */}
                {result && (
                  <div
                    className={`rounded-xl border p-4 space-y-4 transition-all ${
                      result.verdict === "red"
                        ? "bg-rose-950/20 border-rose-500/40 shadow-[0_0_25px_rgba(244,63,94,0.15)]"
                        : result.verdict === "amber"
                        ? "bg-amber-950/20 border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.15)]"
                        : "bg-emerald-950/20 border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.15)]"
                    }`}
                  >
                    {/* Verdict Title & Badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        {result.verdict === "red" ? (
                          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                        ) : result.verdict === "amber" ? (
                          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                        ) : (
                          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                        )}
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-white">
                            {result.verdict === "red"
                              ? "Poison Lookalike Attack Suspected"
                              : result.verdict === "amber"
                              ? "Statistical Amount Anomaly"
                              : "Safe Verified Payee"}
                          </span>
                          <div className="text-[11px] text-slate-400">
                            {result.verdict === "red"
                              ? "Spoofs characters of confirmed contact in Walrus memory"
                              : result.verdict === "amber"
                              ? "Transaction volume diverges from verified historical range"
                              : "100% cryptographic match in immutable Walrus memory"}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase border ${
                          result.verdict === "red"
                            ? "bg-rose-500/10 text-rose-300 border-rose-500/40"
                            : result.verdict === "amber"
                            ? "bg-amber-500/10 text-amber-300 border-amber-500/40"
                            : "bg-emerald-500/10 text-emerald-300 border-emerald-500/40"
                        }`}
                      >
                        {result.verdict === "red"
                          ? "POISON_SUSPECTED"
                          : result.verdict === "amber"
                          ? "WARN"
                          : "ALLOW"}
                      </span>
                    </div>

                    {/* Address Highlight / Diff View */}
                    <div className="rounded-lg bg-[#030509]/80 border border-white/[0.08] p-3 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Analyzed Target Address</span>
                        {result.imitates && (
                          <span className="text-rose-400 font-mono text-[10px]">
                            3+3 Lookalike: {result.imitates.prefixLen}p + {result.imitates.suffixLen}s match
                          </span>
                        )}
                      </div>
                      <div>
                        {result.verdict === "red" && result.imitates?.differingRanges ? (
                          renderHighlightedAddress(address, result.imitates.differingRanges)
                        ) : (
                          <span className="font-mono break-all text-xs text-slate-300">{address}</span>
                        )}
                      </div>

                      {result.verdict === "red" && result.imitates && (
                        <div className="pt-2 border-t border-white/[0.06] text-[11px] space-y-1">
                          <span className="text-slate-400">Matches Legitimate Payee:</span>
                          <div className="font-mono text-emerald-400 break-all text-xs">
                            {result.imitates.address}
                          </div>
                          <span className="text-slate-500 text-[10px]">
                            Label: {result.imitates.label}
                          </span>
                        </div>
                      )}

                      {result.verdict === "green" && result.matchedPayee && (
                        <div className="pt-2 border-t border-white/[0.06] text-[11px]">
                          <span className="text-emerald-400 font-semibold">{result.matchedPayee.label}</span>
                          <span className="text-slate-500 text-[10px] ml-2">
                            ({result.matchedPayee.sendCount} past verified transfers)
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Cryptographic Proof Strip */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1 text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-400">✓</span>
                        <span>Zero LLM Verdict</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-400">✓</span>
                        <span>Walrus Blob Verified</span>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
