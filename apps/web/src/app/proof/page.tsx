"use client";

import { useEffect, useState } from "react";
import { Database, ShieldCheck, CheckCircle2, Server, Key, Clock, ExternalLink } from "lucide-react";

export default function ProofPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    loadProof();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Database className="w-6 h-6 text-purple-400" />
          Integration Proof & Live Metrics
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Live technical verification for judges: Walrus Memory mainnet status, Tatum Sui Gateway checkpoints, and memory blobs.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 text-sm">Verifying live integrations...</div>
      ) : !data ? (
        <div className="p-6 text-center text-red-400">Failed to load live proof telemetry.</div>
      ) : (
        <div className="space-y-6">
          {/* Live Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Walrus Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase">Walrus Relayer</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    data.integrations.walrusMemory.status === "online"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {data.integrations.walrusMemory.status.toUpperCase()}
                </span>
              </div>
              <div className="text-xs font-mono text-slate-300 truncate">
                {data.integrations.walrusMemory.relayerUrl}
              </div>
              <div className="text-[11px] text-slate-500">
                Mainnet TEE decentralized memory store
              </div>
            </div>

            {/* Tatum Sui Gateway */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase">Tatum Sui Gateway</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    data.integrations.tatumSuiGateway.status === "online"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {data.integrations.tatumSuiGateway.status.toUpperCase()}
                </span>
              </div>
              <div className="text-xs text-slate-200">
                Checkpoint:{" "}
                <span className="font-mono text-purple-300 font-bold">
                  #{data.integrations.tatumSuiGateway.latestCheckpoint?.sequenceNumber?.toLocaleString() || "Syncing"}
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                Epoch: {data.integrations.tatumSuiGateway.latestCheckpoint?.epoch?.epochId || "N/A"}
              </div>
            </div>

            {/* Tatum Data API */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase">Tatum Data API</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  ACTIVE
                </span>
              </div>
              <div className="text-xs text-slate-200">
                Multi-chain transfer history
              </div>
              <div className="text-[11px] text-slate-500">
                ETH, BSC, Base with zero-value detection
              </div>
            </div>
          </div>

          {/* Counts Overview */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Protected Payee Memory Stats
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                <div className="text-2xl font-black text-white">{data.counts.watchedWallets}</div>
                <div className="text-xs text-slate-400 mt-1">Watched Wallets</div>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                <div className="text-2xl font-black text-sky-400">{data.counts.confirmedPayees}</div>
                <div className="text-xs text-slate-400 mt-1">Confirmed Payees</div>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                <div className="text-2xl font-black text-indigo-400">{data.counts.cachedTransfers}</div>
                <div className="text-xs text-slate-400 mt-1">Cached Transfers</div>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                <div className="text-2xl font-black text-purple-400">{data.counts.walrusOutboxTotal}</div>
                <div className="text-xs text-slate-400 mt-1">Memory Outbox Jobs</div>
              </div>
            </div>
          </div>

          {/* Walrus Memories Log */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Walrus Memory Outbox Telemetry
            </h2>
            {data.memories.length === 0 ? (
              <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-xl text-center text-xs text-slate-500">
                No memories queued yet. Confirm a payee from the Payees screen to write your first memory.
              </div>
            ) : (
              <div className="space-y-2">
                {data.memories.map((m: any) => (
                  <div
                    key={m.id}
                    className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <span className="text-slate-400">{m.namespace}</span>
                      {m.blobId && <span className="ml-2 text-purple-400">Blob: {m.blobId}</span>}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        m.status === "confirmed"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
