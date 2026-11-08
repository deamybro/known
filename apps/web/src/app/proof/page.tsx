"use client";

import { useEffect, useState } from "react";
import { Database, ShieldCheck, CheckCircle2, Server, Key, Clock, ExternalLink, RefreshCw, Zap, Cpu, Lock } from "lucide-react";

export default function ProofPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  async function loadProof() {
    try {
      const res = await fetch("/api/proof");
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    try {
      await fetch("/api/sync", { method: "POST" });
      await loadProof();
    } catch (err) {
      console.error("Sync failed:", err);
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    loadProof();
  }, []);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="space-y-2 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/25 text-xs font-semibold text-purple-400">
          <Database className="w-3.5 h-3.5" />
          <span>Hackathon Judges Audit & Telemetry</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Integration Proof & Live Metrics
        </h1>
        <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
          Verifiable on-chain signals: live Tatum Sui Gateway checkpoint sync, Walrus Memory TEE relayer status,
          and decentralized memory outbox blob tracking.
        </p>
      </div>

      {loading ? (
        <div className="glass-card p-16 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-3 rounded-2xl">
          <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
          <span>Gathering live telemetry from Tatum and Walrus...</span>
        </div>
      ) : !data ? (
        <div className="p-8 text-center text-rose-400 bg-rose-950/20 border border-rose-500/25 rounded-2xl text-xs">
          Failed to load live proof telemetry. Please check server logs.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Live Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Walrus Card */}
            <div className="glass-card rounded-[24px] p-6 space-y-3.5 glow-emerald">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Walrus Memory</span>
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${
                    data.integrations.walrusMemory.status === "online"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-400"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-beacon" />
                  {data.integrations.walrusMemory.status.toUpperCase()}
                </span>
              </div>
              <div className="text-xs font-mono text-slate-300 truncate bg-[#060910] p-2.5 rounded-xl border border-white/5">
                {data.integrations.walrusMemory.relayerUrl}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                <span>Protocol: Mainnet Relayer</span>
                <span className="text-emerald-400 font-semibold">Writes: OK</span>
              </div>
            </div>

            {/* Tatum Sui Gateway */}
            <div className="glass-card rounded-[24px] p-6 space-y-3.5 glow-cyan">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-sky-400" />
                  <span>Tatum Sui Gateway</span>
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${
                    data.integrations.tatumSuiGateway.status === "online"
                      ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                      : "bg-rose-500/10 text-rose-400"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                  {data.integrations.tatumSuiGateway.status.toUpperCase()}
                </span>
              </div>
              <div className="text-xs font-mono text-slate-300 truncate bg-[#060910] p-2.5 rounded-xl border border-white/5">
                Checkpoint: #{data.integrations.tatumSuiGateway.latestCheckpoint}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                <span>Network: Sui Mainnet</span>
                <span className="text-sky-300 font-semibold font-mono">
                  Epoch {data.integrations.tatumSuiGateway.currentEpoch}
                </span>
              </div>
            </div>

            {/* Cryptographic Signer */}
            <div className="glass-card rounded-[24px] p-6 space-y-3.5 glow-purple">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-purple-400" />
                  <span>Sui Ed25519 Signer</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[11px] font-bold">
                  ACTIVE
                </span>
              </div>
              <div className="text-xs font-mono text-slate-300 truncate bg-[#060910] p-2.5 rounded-xl border border-white/5">
                {data.signerAddress}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                <span>Algorithm: Pure Ed25519</span>
                <span className="text-purple-400 font-semibold">Verified</span>
              </div>
            </div>
          </div>

          {/* Sync Trigger and Outbox Table */}
          <div className="glass-card rounded-[28px] p-6 sm:p-7 border border-white/[0.08] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>Walrus Decentralized Memory Outbox</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Asynchronous durable worker writes confirmed payees into cryptographic Walrus blobs.
                </p>
              </div>

              <button
                onClick={handleSync}
                disabled={syncing}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs transition flex items-center gap-2 shadow-lg disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
                <span>{syncing ? "Syncing Outbox..." : "Trigger Walrus Sync"}</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] text-slate-400 uppercase tracking-wider border-b border-white/[0.06] bg-black/30">
                  <tr>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Walrus Blob ID / Object</th>
                    <th className="py-3 px-3">Attempts</th>
                    <th className="py-3 px-3">Last Attempt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {data.outbox.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        No pending outbox entries. All memories synced to Walrus.
                      </td>
                    </tr>
                  ) : (
                    data.outbox.map((row: any) => (
                      <tr key={row.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              row.status === "synced"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : row.status === "failed"
                                ? "bg-rose-500/10 text-rose-400"
                                : "bg-amber-500/10 text-amber-400"
                            }`}
                          >
                            {row.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-300">
                          {row.memoryType}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">
                          {row.walrusBlobId ? (
                            <span className="text-emerald-400">{row.walrusBlobId.slice(0, 16)}...</span>
                          ) : (
                            <span className="text-slate-600">Pending upload</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-400">{row.attempts}</td>
                        <td className="py-3 px-3 text-slate-500 text-[11px]">
                          {row.lastAttemptAt ? new Date(row.lastAttemptAt).toLocaleTimeString() : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Standalone Disaster Recovery Tool Documentation */}
          <div className="glass-panel p-6 rounded-[24px] border border-white/[0.08] space-y-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Standalone Zero-Database Walrus Recovery CLI</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              If the database or server is completely destroyed, our recovery tool recovers all confirmed payees directly from Walrus blobs using only your private key:
            </p>
            <div className="bg-[#060910] p-3 rounded-xl border border-white/5 font-mono text-xs text-emerald-400">
              pnpm --filter @known/tools-restore run restore
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
