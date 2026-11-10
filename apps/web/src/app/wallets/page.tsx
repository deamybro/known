"use client";

import { useEffect, useState } from "react";
import { Wallet, Plus, RefreshCw, CheckCircle, AlertTriangle, ArrowRight, Sparkles, Database, Layers } from "lucide-react";
import Link from "next/link";

interface WatchedWallet {
  id: string;
  chain: string;
  address: string;
  normalized: string;
  addedAt: string;
}

export default function WalletsPage() {
  const [wallets, setWallets] = useState<WatchedWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Form state
  const [chain, setChain] = useState<string>("ethereum");
  const [address, setAddress] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadWallets() {
    try {
      const res = await fetch("/api/wallets");
      const data = await res.json();
      if (data.wallets) {
        setWallets(data.wallets);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWallets();
  }, []);

  async function handleAddWallet(e: React.FormEvent) {
    e.preventDefault();
    if (!address.trim()) return;
    setIsAdding(true);
    setError(null);

    try {
      const res = await fetch("/api/wallets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chain, address: address.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add wallet");
      }
      setAddress("");
      await loadWallets();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAdding(false);
    }
  }

  async function handleImport(wallet: WatchedWallet) {
    setImportingId(wallet.id);
    setImportStatus(`Ingesting ${wallet.chain.toUpperCase()} transactions via Tatum Data API...`);
    setError(null);

    try {
      const res = await fetch("/api/wallets/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chain: wallet.chain, address: wallet.address }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to import history");
      }
      setImportStatus(
        `Import complete: ${data.importedCount} transactions fetched via Tatum (${data.savedNewCount} new). Inbound dust quarantined.`
      );
    } catch (err: any) {
      setError(err.message);
      setImportStatus(null);
    } finally {
      setImportingId(null);
    }
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="space-y-2 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-xs font-semibold text-indigo-400">
          <Wallet className="w-3.5 h-3.5" />
          <span>Multi-Chain Ingestion Engine</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Watched Wallets & Ingestion
        </h1>
        <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
          Connect your wallets to ingest real transaction history via Tatum Data APIs. Known quarantines inbound dust
          and learns your legitimate payment patterns without ever asking for your private keys.
        </p>
      </div>

      {/* Add Wallet Card */}
      <div className="glass-card rounded-[28px] p-6 sm:p-7 border border-white/[0.08] space-y-4">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>Add Wallet for History Ingestion</span>
        </h2>

        <form onSubmit={handleAddWallet} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-4">
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Blockchain
              </label>
              <select
                value={chain}
                onChange={(e) => setChain(e.target.value)}
                className="w-full bg-[#060910] border border-white/10 rounded-xl px-3.5 py-3 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
              >
                <option value="sui">Sui Mainnet</option>
                <option value="ethereum">Ethereum</option>
                <option value="bsc">BNB Chain</option>
                <option value="base">Base</option>
                <option value="polygon">Polygon</option>
              </select>
            </div>

            <div className="sm:col-span-8">
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Wallet Public Address
              </label>
              <input
                type="text"
                placeholder="0x... or Sui address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-[#060910] border border-white/10 rounded-xl px-3.5 py-3 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 transition shadow-inner placeholder:text-slate-600"
              />
              <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-400">
                <span>Quick Presets:</span>
                <button
                  type="button"
                  onClick={() => {
                    setChain("sui");
                    setAddress("0x2c10b784e27f00223f05d5c077b966f3660a920215ff0a6f059cbffc841103c8");
                  }}
                  className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 hover:border-white/30 text-[10px] text-slate-300 transition"
                >
                  Demo Sui Wallet
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setChain("ethereum");
                    setAddress("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
                  }}
                  className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 hover:border-white/30 text-[10px] text-slate-300 transition"
                >
                  vitalik.eth (Ethereum)
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isAdding || !address.trim()}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-xs transition shadow-[0_0_25px_rgba(99,102,241,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isAdding ? "Adding..." : "Add Wallet & Track via Tatum"}
          </button>
        </form>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {importStatus && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{importStatus}</span>
          </div>
        )}
      </div>

      {/* Active Watched Wallets */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Active Watched Wallets ({wallets.length})</span>
          <span className="text-slate-500">Read-Only History Ingestion</span>
        </h2>

        {loading ? (
          <div className="glass-card p-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-3 rounded-2xl">
            <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <span>Loading tracked wallets...</span>
          </div>
        ) : wallets.length === 0 ? (
          <div className="glass-card p-12 text-center rounded-2xl space-y-3">
            <Wallet className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm text-slate-400">No watched wallets added yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {wallets.map((w) => (
              <div
                key={w.id}
                className="glass-card rounded-2xl p-5 border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 uppercase font-mono text-[10px] text-slate-300 font-bold">
                      {w.chain}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Added {new Date(w.addedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="font-mono text-xs text-slate-300 truncate select-all">
                    {w.address}
                  </div>
                </div>

                <button
                  onClick={() => handleImport(w)}
                  disabled={importingId === w.id}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold transition flex items-center gap-2 shrink-0 self-start sm:self-center disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${importingId === w.id ? "animate-spin" : ""}`} />
                  <span>{importingId === w.id ? "Ingesting..." : "Sync via Tatum"}</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
