"use client";

import { useEffect, useState } from "react";
import { Wallet, Plus, RefreshCw, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";
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
    setImportStatus(`Importing ${wallet.chain.toUpperCase()} history via Tatum...`);
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
        `Import complete: ${data.importedCount} transfers fetched via Tatum (${data.savedNewCount} new).`
      );
    } catch (err: any) {
      setError(err.message);
      setImportStatus(null);
    } finally {
      setImportingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Wallet className="w-6 h-6 text-indigo-400" />
          Watched Wallets
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Add your wallets. Known pulls your real transfer history through Tatum to learn who you actually pay.
        </p>
      </div>

      {/* Add Wallet Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <h2 className="text-base font-semibold text-white mb-3">Add a Wallet to Watch</h2>
        <form onSubmit={handleAddWallet} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Blockchain</label>
              <select
                value={chain}
                onChange={(e) => setChain(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="ethereum">Ethereum</option>
                <option value="sui">Sui</option>
                <option value="bsc">BNB Smart Chain</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1">Wallet Address</label>
              <input
                type="text"
                placeholder="0x..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-lg text-xs text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isAdding || !address.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" />
              <span>{isAdding ? "Adding..." : "Add Wallet"}</span>
            </button>
          </div>
        </form>
      </div>

      {importStatus && (
        <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-sm text-emerald-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>{importStatus}</span>
          </div>
          <Link
            href="/payees"
            className="text-xs font-semibold text-emerald-300 hover:underline flex items-center gap-1"
          >
            <span>Review suggested payees</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Wallets List */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-white">Your Watched Wallets</h2>

        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading wallets...</div>
        ) : wallets.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-center space-y-3">
            <p className="text-slate-400 text-sm">No watched wallets added yet.</p>
            <p className="text-xs text-slate-500">
              Add your Sui or Ethereum address above, or try Vitalik&apos;s public address (
              <span
                className="text-indigo-400 cursor-pointer underline font-mono"
                onClick={() => {
                  setChain("ethereum");
                  setAddress("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
                }}
              >
                0xd8dA...6045
              </span>
              ) to test live Tatum import right now.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {wallets.map((w) => (
              <div
                key={w.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded text-xs uppercase font-bold tracking-wider">
                      {w.chain}
                    </span>
                    <span className="text-xs text-slate-500">
                      Added {new Date(w.addedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="font-mono text-sm text-slate-200 break-all">{w.address}</div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => handleImport(w)}
                    disabled={importingId === w.id}
                    className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${importingId === w.id ? "animate-spin text-indigo-400" : ""}`} />
                    <span>{importingId === w.id ? "Importing via Tatum..." : "Import History"}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
