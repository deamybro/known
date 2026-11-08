import "./globals.css";
import Link from "next/link";
import { Shield, Users, Wallet, Database, Sparkles, ExternalLink, Activity } from "lucide-react";

export const metadata = {
  title: "Known — Sovereign Payment Memory Against Address Poisoning",
  description: "Your transaction history can be poisoned. Your memory can't.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#04060a] text-slate-100 flex flex-col min-h-screen relative antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
        
        {/* Ambient Top Glow Mesh */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[450px] bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.15),rgba(56,189,248,0.06),transparent_70%)] pointer-events-none -z-10" />
        <div className="fixed inset-0 bg-grid-pattern opacity-60 pointer-events-none -z-10" />

        {/* Top Hackathon & Network Ribbon */}
        <div className="border-b border-white/[0.06] bg-[#060910]/80 backdrop-blur-md px-4 py-2 text-center relative z-40">
          <div className="max-w-6xl mx-auto flex items-center justify-between text-[11px] font-medium text-slate-400">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 pulse-beacon" />
              <span className="text-slate-400">Total Recall Hackathon:</span>
              <span className="text-emerald-300 font-semibold hidden sm:inline">Tatum Data APIs × Walrus Memory Mainnet</span>
              <span className="text-emerald-300 font-semibold sm:hidden">Tatum × Walrus</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="text-slate-400 hidden md:inline">Track 03: Consumer Finance</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-bold">
                Zero-LLM Safety
              </span>
            </div>
          </div>
        </div>

        {/* Floating Luxury Navbar */}
        <header className="sticky top-4 z-50 px-4 max-w-5xl w-full mx-auto">
          <div className="glass-card rounded-2xl px-4 py-3 flex items-center justify-between shadow-[0_10px_35px_rgba(0,0,0,0.5)]">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-300 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.45)] text-slate-950 font-black text-base transform group-hover:scale-105 transition-transform duration-300">
                  K
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-[#04060a] flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent group-hover:from-emerald-300 transition">
                  KNOWN
                </span>
                <span className="text-[9px] font-mono tracking-widest text-emerald-400/90 -mt-1 uppercase">
                  Payment Memory
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden sm:flex items-center gap-1.5 text-xs font-semibold">
              <Link
                href="/"
                className="px-3.5 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.08] transition flex items-center gap-2 group"
              >
                <Shield className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>Pre-Flight Check</span>
              </Link>
              <Link
                href="/payees"
                className="px-3.5 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.08] transition flex items-center gap-2 group"
              >
                <Users className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
                <span>Payee Book</span>
              </Link>
              <Link
                href="/wallets"
                className="px-3.5 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.08] transition flex items-center gap-2 group"
              >
                <Wallet className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
                <span>Wallets</span>
              </Link>
              <Link
                href="/proof"
                className="px-3.5 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.08] transition flex items-center gap-2 group"
              >
                <Database className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
                <span>Proof & Audit</span>
              </Link>
            </nav>

            {/* Walrus Connection Pill */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-medium text-emerald-300 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-400 pulse-beacon" />
                <span className="hidden sm:inline font-mono">Walrus Mainnet Relayer</span>
                <span className="sm:hidden font-mono">Walrus</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 pt-8 pb-28">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-white/[0.06] bg-[#060910]/70 py-6 text-center text-xs text-slate-500">
          <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Known — Sovereign Payment Memory Against Address Poisoning</span>
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              Powered by Tatum Data APIs & Walrus Memory
            </div>
          </div>
        </footer>

        {/* Bottom Mobile Floating Navigation */}
        <div className="sm:hidden fixed bottom-4 left-4 right-4 z-50">
          <div className="glass-card rounded-2xl shadow-2xl flex justify-around py-2 px-2 border border-white/10">
            <Link href="/" className="flex flex-col items-center gap-1 text-[10px] text-slate-400 hover:text-emerald-400 py-1 px-3">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Check</span>
            </Link>
            <Link href="/payees" className="flex flex-col items-center gap-1 text-[10px] text-slate-400 hover:text-sky-400 py-1 px-3">
              <Users className="w-4 h-4 text-sky-400" />
              <span>Payees</span>
            </Link>
            <Link href="/wallets" className="flex flex-col items-center gap-1 text-[10px] text-slate-400 hover:text-indigo-400 py-1 px-3">
              <Wallet className="w-4 h-4 text-indigo-400" />
              <span>Wallets</span>
            </Link>
            <Link href="/proof" className="flex flex-col items-center gap-1 text-[10px] text-slate-400 hover:text-purple-400 py-1 px-3">
              <Database className="w-4 h-4 text-purple-400" />
              <span>Proof</span>
            </Link>
          </div>
        </div>

      </body>
    </html>
  );
}
