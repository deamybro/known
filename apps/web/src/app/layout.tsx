import "./globals.css";
import Link from "next/link";
import { Shield, Users, Wallet, Database, Radio, ArrowUpRight } from "lucide-react";

export const metadata = {
  title: "Known Memory — Sovereign Payment Memory on Walrus",
  description: "Your payment history can be poisoned. Your memory can't.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col text-slate-100 antialiased selection:bg-purple-500/30 selection:text-white">
        
        {/* Minimal High-End Header matching Walrus Memory */}
        <header className="w-full pt-8 pb-4 px-6 lg:px-14 max-w-7xl mx-auto flex items-center justify-between z-30">
          <Link href="/" className="flex flex-col select-none group">
            <span className="text-2xl font-bold tracking-tight text-white leading-none group-hover:text-slate-200 transition">
              known
            </span>
            <span className="text-lg font-normal text-slate-400 tracking-tight leading-none mt-1 group-hover:text-slate-300 transition">
              memory
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold tracking-wide uppercase text-slate-400">
            <Link
              href="/"
              className="text-white hover:text-slate-200 transition flex items-center gap-1.5"
            >
              <span>Radar</span>
            </Link>
            <Link
              href="/payees"
              className="hover:text-white transition flex items-center gap-1.5"
            >
              <span>Payees</span>
            </Link>
            <Link
              href="/wallets"
              className="hover:text-white transition flex items-center gap-1.5"
            >
              <span>Wallets</span>
            </Link>
            <Link
              href="/proof"
              className="hover:text-white transition flex items-center gap-1.5"
            >
              <span>Proof & Audit</span>
            </Link>
          </nav>

          {/* Right Status Beacon & Pill */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.1] text-[11px] font-mono text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 beacon-dot" />
              <span>Walrus Mainnet OK</span>
            </div>
            <Link
              href="/wallets"
              className="btn-pill text-xs py-2 px-4 border-white/[0.14] hover:border-white/30"
            >
              Connect Wallet
            </Link>
          </div>
        </header>

        {/* Main Content Expansive Container */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-6 lg:px-14 pt-4 pb-20">
          {children}
        </main>

        {/* Subtle Bottom Footer */}
        <footer className="border-t border-white/[0.06] py-8 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-6 lg:px-14 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-400">Known Memory</span>
              <span>•</span>
              <span>Total Recall: Tatum Data APIs × Walrus Memory Protocol</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-500">
              <span>Track 03: Consumer Finance Apps</span>
              <span>•</span>
              <span className="font-mono text-slate-400">Zero LLM Hallucinations</span>
            </div>
          </div>
        </footer>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
          <div className="card-terminal p-2 flex justify-around border border-white/[0.15] bg-[#070a12]/95 backdrop-blur-lg shadow-2xl">
            <Link href="/" className="flex flex-col items-center gap-1 text-[11px] text-white py-1 px-3">
              <Radio className="w-4 h-4 text-emerald-400" />
              <span>Radar</span>
            </Link>
            <Link href="/payees" className="flex flex-col items-center gap-1 text-[11px] text-slate-400 hover:text-white py-1 px-3">
              <Users className="w-4 h-4 text-sky-400" />
              <span>Payees</span>
            </Link>
            <Link href="/wallets" className="flex flex-col items-center gap-1 text-[11px] text-slate-400 hover:text-white py-1 px-3">
              <Wallet className="w-4 h-4 text-indigo-400" />
              <span>Wallets</span>
            </Link>
            <Link href="/proof" className="flex flex-col items-center gap-1 text-[11px] text-slate-400 hover:text-white py-1 px-3">
              <Database className="w-4 h-4 text-purple-400" />
              <span>Proof</span>
            </Link>
          </div>
        </div>

      </body>
    </html>
  );
}
