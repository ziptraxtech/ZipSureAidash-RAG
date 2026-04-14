"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";

const ChatbotPopup = dynamic(() => import('@/components/ChatbotPopup'), { ssr: false });
import {
  Wallet, CreditCard, TrendingUp, Zap, ArrowDownLeft,
  ArrowUpRight, Clock, CheckCircle2, XCircle, MoreHorizontal,
  Download, Plus, ChevronRight
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Footer from "@/src/components/Footer";

const TopNavigationBar = dynamic(() => import("@/components/TopNavigationBar"), {
  ssr: false,
  loading: () => <div className="h-20 w-full animate-pulse bg-blue-600/20" />,
});

// ── Mock data ────────────────────────────────────────────────────────────────

const WALLET_BALANCE = 2847.50;
const MONTHLY_SPENT  = 1243.00;

const QUICK_STATS = [
  { label: "Total Spent (Lifetime)", value: "₹18,420", icon: <Wallet size={20} />, gradient: "from-blue-500 to-blue-600",   iconBg: "bg-blue-500/10",   iconColor: "text-blue-600",   trend: "+12% vs last month" },
  { label: "Sessions This Month",    value: "34",       icon: <Zap size={20} />,    gradient: "from-amber-500 to-orange-600", iconBg: "bg-amber-500/10",  iconColor: "text-amber-600",  trend: "+8 vs last month" },
  { label: "Avg. Cost / Session",    value: "₹36.56",   icon: <TrendingUp size={20} />, gradient: "from-green-500 to-green-600", iconBg: "bg-green-500/10", iconColor: "text-green-600", trend: "−₹2.10 vs last month" },
  { label: "Active Plan",            value: "Pro",      icon: <CreditCard size={20} />, gradient: "from-purple-500 to-purple-600", iconBg: "bg-purple-500/10", iconColor: "text-purple-600", trend: "Renews 01 May 2026" },
];

const PAYMENT_METHODS = [
  { name: "Rahul Sharma",  number: "**** **** **** 4521", expiry: "08/27", brand: "Visa",       primary: true,  color: "from-blue-600 to-blue-800" },
  { name: "Rahul Sharma",  number: "**** **** **** 8834", expiry: "03/26", brand: "Mastercard", primary: false, color: "from-slate-700 to-slate-900" },
];

const TRANSACTIONS = [
  { id: "TXN-8821", charger: "Piccadily Back Side Parking", location: "Sector 34, Chandigarh",     date: "13 Apr 2026", time: "09:14 AM", amount: 42.80,  energy: "2.14 kWh", status: "success",  type: "debit" },
  { id: "TXN-8820", charger: "Hauz Khas District Center",   location: "Hauz Khas Metro, Delhi",      date: "12 Apr 2026", time: "06:55 PM", amount: 31.50,  energy: "1.57 kWh", status: "success",  type: "debit" },
  { id: "TXN-8817", charger: "Wallet Top-up",               location: "via UPI · HDFC Bank",          date: "10 Apr 2026", time: "11:30 AM", amount: 500.00, energy: "—",        status: "success",  type: "credit" },
  { id: "TXN-8814", charger: "Qutub Minar Charging Station",location: "Near Qutub Minar, Delhi",    date: "09 Apr 2026", time: "02:20 PM", amount: 28.00,  energy: "1.40 kWh", status: "success",  type: "debit" },
  { id: "TXN-8810", charger: "Passport Office Parking",     location: "Sector 34, Chandigarh",       date: "07 Apr 2026", time: "08:45 AM", amount: 55.20,  energy: "2.76 kWh", status: "success",  type: "debit" },
  { id: "TXN-8805", charger: "Piccadily Multiplex II",      location: "Sector 34, Chandigarh",       date: "05 Apr 2026", time: "04:10 PM", amount: 19.60,  energy: "0.98 kWh", status: "failed",   type: "debit" },
  { id: "TXN-8801", charger: "Sapna Cinema",                location: "Okhla Phase III, Delhi",       date: "03 Apr 2026", time: "07:00 PM", amount: 38.40,  energy: "1.92 kWh", status: "success",  type: "debit" },
  { id: "TXN-8796", charger: "Wallet Top-up",               location: "via UPI · SBI Bank",           date: "01 Apr 2026", time: "12:00 PM", amount: 1000.00,energy: "—",        status: "success",  type: "credit" },
  { id: "TXN-8790", charger: "Andheria More Charging Hub",  location: "Near Chattarpur Metro, Delhi", date: "30 Mar 2026", time: "10:30 AM", amount: 47.60,  energy: "2.38 kWh", status: "pending",  type: "debit" },
  { id: "TXN-8785", charger: "TB Hospital Charging Point",  location: "Near Qutub Minar, Delhi",     date: "28 Mar 2026", time: "05:15 PM", amount: 22.40,  energy: "1.12 kWh", status: "success",  type: "debit" },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = {
    success: { label: "Paid",    cls: "bg-green-100 text-green-700" },
    pending: { label: "Pending", cls: "bg-amber-100 text-amber-700" },
    failed:  { label: "Failed",  cls: "bg-red-100   text-red-600"   },
  }[status] ?? { label: status, cls: "bg-gray-100 text-gray-600" };

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.cls}`}>
      {status === "success" && <CheckCircle2 size={11} />}
      {status === "pending" && <Clock size={11} />}
      {status === "failed"  && <XCircle size={11} />}
      {cfg.label}
    </span>
  );
}

// ── Main content ──────────────────────────────────────────────────────────────

function PaymentsContent() {
  const searchParams = useSearchParams();
  const rawId = searchParams.get("device") || "9";
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewRange, setViewRange]       = useState("day");

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopNavigationBar
        onDateChange={setSelectedDate}
        onRangeChange={setViewRange}
        exportId="payments-area"
        showChat={false}
      />

      <main className="flex-grow">
        <div id="payments-area" className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">

          {/* ── Page heading ── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Payments &amp; Wallet</h1>
              <p className="text-gray-600 text-sm sm:text-base">Manage your balance, transactions, and payment methods</p>
            </div>
            <button className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-md transition-all self-start sm:self-auto">
              <Plus size={16} /> Add Money
            </button>
          </div>

          {/* ── Wallet + stats row ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Wallet card */}
            <div
              className="lg:col-span-1 rounded-2xl p-6 text-white shadow-xl flex flex-col justify-between min-h-[200px]"
              style={{ background: "linear-gradient(135deg, #1e40af 0%, #2563eb 60%, #3b82f6 100%)" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-white/20 p-2 rounded-xl">
                    <Wallet size={18} className="text-white" />
                  </div>
                  <span className="font-semibold text-sm text-blue-100">ZipSure Wallet</span>
                </div>
                <span className="text-xs bg-white/15 border border-white/20 px-2.5 py-1 rounded-full font-medium">Active</span>
              </div>

              <div>
                <p className="text-blue-200 text-xs font-medium mb-1">Available Balance</p>
                <p className="text-4xl font-bold tracking-tight">₹{WALLET_BALANCE.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/20">
                <div>
                  <p className="text-blue-200 text-[10px] font-medium">Spent this month</p>
                  <p className="text-white font-semibold text-sm">₹{MONTHLY_SPENT.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
                </div>
                <button className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-medium px-3 py-1.5 rounded-xl transition-all">
                  <Download size={13} /> Statement
                </button>
              </div>
            </div>

            {/* Quick stats */}
            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
              {QUICK_STATS.map((s, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-5 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`${s.iconBg} ${s.iconColor} p-2.5 rounded-xl`}>{s.icon}</div>
                    <ChevronRight size={14} className="text-gray-300 mt-1" />
                  </div>
                  <p className="text-xs font-medium text-gray-500 mb-1">{s.label}</p>
                  <p className={`text-2xl font-bold bg-gradient-to-r ${s.gradient} bg-clip-text text-transparent`}>{s.value}</p>
                  <p className="text-[11px] text-gray-400 mt-1">{s.trend}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Payment methods ── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Payment Methods</h2>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                <Plus size={14} /> Add card
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {PAYMENT_METHODS.map((card, i) => (
                <div
                  key={i}
                  className={`bg-gradient-to-br ${card.color} text-white p-6 rounded-2xl shadow-lg relative overflow-hidden hover:scale-[1.02] transition-all duration-300`}
                >
                  {/* Decorative circles */}
                  <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/5 rounded-full" />
                  <div className="absolute -right-2 -bottom-8 w-20 h-20 bg-white/5 rounded-full" />

                  <div className="flex justify-between items-start mb-8 relative">
                    <span className="text-[11px] font-semibold tracking-widest text-white/60 uppercase">{card.brand}</span>
                    {card.primary && (
                      <span className="text-[10px] bg-white/20 border border-white/20 px-2 py-0.5 rounded-full font-medium">Primary</span>
                    )}
                  </div>

                  <p className="text-lg font-bold tracking-[0.18em] font-mono mb-6 relative">{card.number}</p>

                  <div className="flex justify-between items-end relative">
                    <div>
                      <p className="text-[9px] uppercase text-white/40 font-semibold mb-0.5">Card Holder</p>
                      <p className="text-sm font-semibold uppercase tracking-tight">{card.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] uppercase text-white/40 font-semibold mb-0.5">Expires</p>
                      <p className="text-sm font-semibold">{card.expiry}</p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add new card placeholder */}
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer min-h-[180px]">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                  <Plus size={20} />
                </div>
                <p className="text-sm font-medium text-gray-500">Add new card</p>
              </div>
            </div>
          </div>

          {/* ── Transaction history ── */}
          <Card className="rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Transaction History</h2>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                <Download size={14} /> Export
              </button>
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Transaction</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date &amp; Time</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Energy</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Amount</th>
                    <th className="px-6 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {TRANSACTIONS.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            tx.type === "credit" ? "bg-green-100 text-green-600" : "bg-blue-50 text-blue-600"
                          }`}>
                            {tx.type === "credit"
                              ? <ArrowDownLeft size={16} />
                              : <ArrowUpRight size={16} />}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800 leading-tight">{tx.charger}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{tx.location} · {tx.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700">{tx.date}</p>
                        <p className="text-xs text-gray-400">{tx.time}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{tx.energy}</td>
                      <td className="px-6 py-4"><StatusBadge status={tx.status} /></td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-sm font-bold ${tx.type === "credit" ? "text-green-600" : "text-gray-800"}`}>
                          {tx.type === "credit" ? "+" : "−"}₹{tx.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                          <MoreHorizontal size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <div className="sm:hidden divide-y divide-gray-100">
              {TRANSACTIONS.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    tx.type === "credit" ? "bg-green-100 text-green-600" : "bg-blue-50 text-blue-600"
                  }`}>
                    {tx.type === "credit" ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{tx.charger}</p>
                    <p className="text-xs text-gray-400">{tx.date} · {tx.time}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${tx.type === "credit" ? "text-green-600" : "text-gray-800"}`}>
                      {tx.type === "credit" ? "+" : "−"}₹{tx.amount.toFixed(2)}
                    </p>
                    <StatusBadge status={tx.status} />
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 text-center">
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View all transactions</button>
            </div>
          </Card>

        </div>
      </main>
      <Footer />
      <ChatbotPopup deviceId={rawId} />
    </div>
  );
}

export default function PaymentPlansPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-400 font-medium animate-pulse">Loading payments...</p>
      </div>
    }>
      <PaymentsContent />
    </Suspense>
  );
}
