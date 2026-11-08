import "./globals.css";
import Link from "next/link";
import { Shield, Users, Wallet, Database, Sparkles, ExternalLink, Activity, Radio } from "lucide-react";

export const metadata = {
  title: "Known — Sovereign Payment Memory on Walrus",
  description: "Your transaction history can be poisoned. Your memory can't.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col text-slate-100 antialiased selection:bg-[#00f5d4]/30 selection:text-[#00f5d4]">
        
        {/* Top Hackathon & Network Ribbon */}
        <div className="border-b border-white/[0.08] bg-[#050c18]/80 backdrop-blur-md px-4 py-2 text-center relative z-40">
          <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-[#00f5d4] pulse-beacon" />
              <span className="text-slate-400">Total Recall:</span>
              <span className="text-[#00f5d4] font-semibold">Tatum Data APIs × Walrus Decentralized Memory</span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className="hidden md:inline text-slate-400">Track 03: Consumer Finance Apps</span>
              <span className="px-2 py-0.5 rounded-full bg-[#00f5d4]/10 text-[#00f5d4] border border-[#00f5d4]/25 font-bold">
                Mainnet Live
              </span>
            </div>
          </div>
        </div>

        {/* Floating Walrus-Style Navbar */}
        <header className="sticky top-3 z-50 px-4 max-w-5xl w-full mx-auto">
          <div className="walrus-card px-5 py-3.5 flex items-center justify-between shadow-[0_15px_40px_rgba(0,0,0,0.6)]">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00f5d4] via-[#0d9488] to-[#38bdf8] flex items-center justify-center shadow-[0_0_25px_rgba(0,245,212,0.45)] text-slate-950 font-black text-lg transform group-hover:scale-105 transition-transform duration-300">
                  🦭
                </div>
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#030712] flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-[#00f5d4] animate-pulse" />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-lg tracking-tight text-white group-hover:text-[#00f5d4] transition">
                    KNOWN
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#00f5d4]/10 text-[#00f5d4] border border-[#00f5d4]/30 font-bold uppercase">
                    MEMORY
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 tracking-wider">
                  Payment Defense
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden sm:flex items-center gap-1 text-xs font-bold">
              <Link
                href="/"
                className="px-3.5 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-white/[0.08] transition flex items-center gap-2 group"
              >
                <Radio className="w-4 h-4 text-[#00f5d4] group-hover:scale-110 transition-transform" />
                <span>Pre-Flight Radar</span>
              </Link>
              <Link
                href="/payees"
                className="px-3.5 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-white/[0.08] transition flex items-center gap-2 group"
              >
                <Users className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
                <span>Payee Book</span>
              </Link>
              <Link
                href="/wallets"
                className="px-3.5 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-white/[0.08] transition flex items-center gap-2 group"
              >
                <Wallet className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                <span>Wallets Ingest</span>
              </Link>
              <Link
                href="/proof"
                className="px-3.5 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-white/[0.08] transition flex items-center gap-2 group"
              >
                <Database className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                <span>Proof & Audit</span>
              </Link>
            </nav>

            {/* Walrus Connection Pill */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00f5d4]/10 border border-[#00f5d4]/30 text-xs font-bold text-[#00f5d4] shadow-sm">
                <span className="h-2 w-2 rounded-full bg-[#00f5d4] pulse-beacon" />
                <span className="hidden sm:inline font-mono">Walrus Relayer OK</span>
                <span className="sm:hidden font-mono">Walrus</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Container */}
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 pt-8 pb-28">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-white/[0.08] bg-[#050c18]/90 py-6 text-center text-xs text-slate-400">
          <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[#00f5d4]">🦭</span>
              <span>Known — Sovereign Payment Memory Powered by Walrus Protocol & Tatum</span>
            </div>
            <div className="font-mono text-slate-400">
              Built by Maris (@Stella112)
            </div>
          </div>
        </footer>

        {/* Mobile Navigation Bar */}
        <div className="sm:hidden fixed bottom-4 left-4 right-4 z-50">
          <div className="walrus-card p-2 flex justify-around border border-[#00f5d4]/30 shadow-2xl">
            <Link href="/" className="flex flex-col items-center gap-1 text-[11px] text-slate-300 hover:text-[#00f5d4] py-1 px-3">
              <Radio className="w-4 h-4 text-[#00f5d4]" />
              <span>Radar</span>
            </Link>
            <Link href="/payees" className="flex flex-col items-center gap-1 text-[11px] text-slate-300 hover:text-sky-400 py-1 px-3">
              <Users className="w-4 h-4 text-sky-400" />
              <span>Payees</span>
            </Link>
            <Link href="/wallets" className="flex flex-col items-center gap-1 text-[11px] text-slate-300 hover:text-indigo-400 py-1 px-3">
              <Wallet className="w-4 h-4 text-indigo-400" />
              <span>Wallets</span>
            </Link>
            <Link href="/proof" className="flex flex-col items-center gap-1 text-[11px] text-slate-300 hover:text-purple-400 py-1 px-3">
              <Database className="w-4 h-4 text-purple-400" />
              <span>Proof</span>
            </Link>
          </div>
        </div>

      </body>
    </html>
  );
}
