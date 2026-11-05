import "./globals.css";
import Link from "next/link";
import { Shield, Users, Wallet, CheckCircle, Database } from "lucide-react";

export const metadata = {
  title: "Known — Transaction Memory Against Address Poisoning",
  description: "Your transaction history can be poisoned. Your memory can't.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const isDemo = process.env.APP_MODE === "DEMO" || true;

  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 flex flex-col min-h-screen">
        {/* Top Header & Demo Banner */}
        <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-50">
          {isDemo && (
            <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1 text-xs text-amber-400 text-center font-medium">
              Demo Mode Active — Read-Only Address Protection Powered by Walrus Memory & Tatum
            </div>
          )}
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg text-emerald-400">
              <Shield className="w-5 h-5" />
              <span>Known</span>
            </Link>

            <nav className="flex items-center gap-1 sm:gap-2 text-sm">
              <Link
                href="/"
                className="px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 transition"
              >
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Check</span>
              </Link>
              <Link
                href="/payees"
                className="px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 transition"
              >
                <Users className="w-4 h-4 text-sky-400" />
                <span>Payees</span>
              </Link>
              <Link
                href="/wallets"
                className="px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 transition"
              >
                <Wallet className="w-4 h-4 text-indigo-400" />
                <span>Wallets</span>
              </Link>
              <Link
                href="/proof"
                className="px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 transition"
              >
                <Database className="w-4 h-4 text-purple-400" />
                <span>Proof</span>
              </Link>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 pb-20">{children}</main>

        {/* Bottom Mobile Navigation for Phone view */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 border-t border-slate-800 bg-slate-900/90 backdrop-blur z-50 flex justify-around py-2.5">
          <Link href="/" className="flex flex-col items-center gap-1 text-xs text-slate-400 hover:text-emerald-400">
            <Shield className="w-5 h-5" />
            <span>Check</span>
          </Link>
          <Link href="/payees" className="flex flex-col items-center gap-1 text-xs text-slate-400 hover:text-sky-400">
            <Users className="w-5 h-5" />
            <span>Payees</span>
          </Link>
          <Link href="/wallets" className="flex flex-col items-center gap-1 text-xs text-slate-400 hover:text-indigo-400">
            <Wallet className="w-5 h-5" />
            <span>Wallets</span>
          </Link>
          <Link href="/proof" className="flex flex-col items-center gap-1 text-xs text-slate-400 hover:text-purple-400">
            <Database className="w-5 h-5" />
            <span>Proof</span>
          </Link>
        </div>
      </body>
    </html>
  );
}
