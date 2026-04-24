"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Header from "@/src/components/Header";
import Footer from "@/src/components/Footer";
import { CreditCard, Smartphone, Wallet, CheckCircle, Loader2, Zap, Coins, X, History } from "lucide-react";

const PLANS = [
  {
    id: "basic",
    name: "Basic",
    price: 1,
    credits: 3,
    description: "Up to 3 charging stations",
    features: ["Real-time monitoring", "Email alerts", "30-day history"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 2,
    credits: 10,
    description: "Up to 10 charging stations",
    features: ["Everything in Basic", "AI chatbot", "PDF reports", "Priority support"],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 3,
    credits: 30,
    description: "Unlimited stations",
    features: ["Everything in Pro", "Custom integrations", "Dedicated manager", "SLA guarantee"],
  },
];

const PAYMENT_METHODS = [
  { id: "upi", label: "UPI", icon: <Smartphone size={20} />, desc: "GPay, PhonePe, Paytm UPI" },
  { id: "card", label: "Credit / Debit Card", icon: <CreditCard size={20} />, desc: "Visa, Mastercard, RuPay" },
  { id: "netbanking", label: "Net Banking", icon: <Wallet size={20} />, desc: "All major banks" },
  { id: "wallet", label: "Wallets", icon: <Wallet size={20} />, desc: "Paytm, Amazon Pay, Mobikwik" },
];

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PaymentsPage() {
  const { user, isLoaded } = useUser();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState("upi");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [currentCredits, setCurrentCredits] = useState(null);
  const [history, setHistory] = useState(null);

  useEffect(() => {
    fetch("/api/user/credits")
      .then((r) => r.json())
      .then((d) => setCurrentCredits(d.credits))
      .catch(() => setCurrentCredits(0));

    fetch("/api/payments/history")
      .then((r) => r.json())
      .then((d) => setHistory(d.payments))
      .catch(() => setHistory([]));
  }, []);

  const handlePay = async () => {
    if (!selectedPlan) return;
    setLoading(true);
    setError(null);

    const loaded = await loadRazorpay();
    if (!loaded) {
      setError("Failed to load payment gateway. Check your connection.");
      setLoading(false);
      return;
    }

    try {
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: selectedPlan.price, plan: selectedPlan.id }),
      });
      const order = await orderRes.json();
      if (!orderRes.ok) throw new Error(order.error || "Order creation failed");

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "ZipSure AI",
        description: `${selectedPlan.name} Plan — ${selectedPlan.credits} Credits`,
        image: "/favicon.ico",
        order_id: order.orderId,
        prefill: {
          name: user?.fullName || "",
          email: user?.primaryEmailAddress?.emailAddress || "",
        },
        method: {
          upi: selectedMethod === "upi",
          card: selectedMethod === "card",
          netbanking: selectedMethod === "netbanking",
          wallet: selectedMethod === "wallet",
        },
        theme: { color: "#0ea5e9" },
        handler: async (response) => {
          try {
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...response,
                userId: user?.id,
                email: user?.primaryEmailAddress?.emailAddress,
                plan: selectedPlan.id,
                amount: selectedPlan.price,
              }),
            });
            const result = await verifyRes.json();
            if (result.success) {
              setCurrentCredits((prev) => (prev ?? 0) + selectedPlan.credits);
              fetch("/api/payments/history").then((r) => r.json()).then((d) => setHistory(d.payments)).catch(() => {});
              setSuccess({ plan: selectedPlan, paymentId: response.razorpay_payment_id, creditsAdded: result.creditsAdded });
            } else {
              setError("Payment recorded but verification failed. Contact support.");
            }
          } catch {
            setError("Verification request failed. Contact support with payment ID.");
          } finally {
            setLoading(false);
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (resp) => {
        setError(`Payment failed: ${resp.error.description}`);
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      setError(err.message || "Something went wrong");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow bg-gray-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-10 text-center max-w-md w-full mx-4">
            <div className="flex justify-center mb-4">
              <CheckCircle className="text-green-500" size={56} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-500 mb-3">
              You are now on the <span className="font-semibold text-blue-600">{success.plan.name}</span> plan.
            </p>
            <div className="bg-blue-50 rounded-xl px-6 py-4 mb-4 inline-flex items-center gap-2 mx-auto">
              <Coins size={20} className="text-blue-600" />
              <span className="text-blue-700 font-bold text-lg">+{success.creditsAdded} credits added</span>
            </div>
            <p className="text-sm text-gray-500 mb-1">Your total credits: <span className="font-semibold">{currentCredits}</span></p>
            <p className="text-xs text-gray-400 mb-5">Payment ID: {success.paymentId}</p>
            <a
              href="/overview"
              className="inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-colors"
            >
              Go to Dashboard
            </a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 py-10 max-w-5xl">

          {/* Heading + credits balance */}
          <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg shadow-lg">
                <Zap className="text-white" size={22} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Payments</h1>
                <p className="text-gray-500 text-sm mt-0.5">Choose a plan and pay securely via Razorpay</p>
              </div>
            </div>
            {currentCredits !== null && (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5">
                <Coins size={18} className="text-blue-600" />
                <div>
                  <p className="text-xs text-blue-500 leading-none">Your Credits</p>
                  <p className="text-xl font-bold text-blue-700 leading-tight">{currentCredits}</p>
                </div>
              </div>
            )}
          </div>

          {/* Plans */}
          <div className="grid sm:grid-cols-3 gap-5 mb-3">
            {PLANS.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                className={`relative text-left rounded-2xl border-2 p-6 transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none ${
                  selectedPlan?.id === plan.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-100 bg-white"
                }`}
              >
                {plan.popular && (
                  <span className="absolute top-3 right-3 text-xs font-semibold bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
                    Popular
                  </span>
                )}
                <p className="text-lg font-bold text-gray-900">{plan.name}</p>
                <p className="text-3xl font-extrabold text-blue-600 mt-1">
                  ₹{plan.price}
                  <span className="text-sm font-normal text-gray-400">/mo</span>
                </p>
                <p className="text-sm text-gray-500 mt-1 mb-2">{plan.description}</p>

                {/* Credits badge */}
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1 mb-3 w-fit">
                  <Coins size={13} className="text-amber-500" />
                  <span className="text-xs font-semibold text-amber-700">{plan.credits} credits / month</span>
                </div>

                <ul className="space-y-1">
                  {plan.features.map((f) => (
                    <li key={f} className="text-sm text-gray-600 flex items-center gap-1.5">
                      <CheckCircle size={13} className="text-green-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {selectedPlan?.id === plan.id && (
                  <div className="mt-4 text-xs font-semibold text-blue-600 uppercase tracking-wide">Selected</div>
                )}
              </button>
            ))}
          </div>

          {/* Cancel anytime note */}
          <div className="flex items-center gap-1.5 mb-8 text-gray-400 text-xs">
            <X size={13} className="text-gray-400" />
            Cancel anytime — no long-term commitment
          </div>

          {/* Payment method */}
          {selectedPlan && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Select Payment Method</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMethod(m.id)}
                    className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 transition-all text-left ${
                      selectedMethod === m.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-100 hover:border-gray-300"
                    }`}
                  >
                    <span className={selectedMethod === m.id ? "text-blue-600" : "text-gray-400"}>
                      {m.icon}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{m.label}</p>
                      <p className="text-xs text-gray-400">{m.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {selectedPlan && (
            <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4">
              <div>
                <p className="text-sm text-gray-500">Total due</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{selectedPlan.price}<span className="text-sm font-normal text-gray-400">/month</span>
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {selectedPlan.name} plan · {selectedPlan.credits} credits · Cancel anytime
                </p>
              </div>
              <button
                onClick={handlePay}
                disabled={loading || !isLoaded}
                className="flex items-center gap-2 px-7 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-full transition-colors shadow-lg"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                {loading ? "Processing…" : `Pay ₹${selectedPlan.price}`}
              </button>
            </div>
          )}

          {!selectedPlan && (
            <p className="text-center text-gray-400 text-sm mt-4">Select a plan above to continue</p>
          )}

          {/* Payment History */}
          <div className="mt-12">
            <div className="flex items-center gap-2 mb-4">
              <History size={18} className="text-gray-500" />
              <h2 className="text-lg font-bold text-gray-900">Payment History</h2>
            </div>

            {history === null ? (
              <div className="flex items-center gap-2 text-gray-400 text-sm py-6">
                <Loader2 size={16} className="animate-spin" />
                Loading history…
              </div>
            ) : history.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-10 text-center text-gray-400 text-sm">
                No payments yet — your transactions will appear here after your first purchase.
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 text-left">
                      <th className="px-5 py-3 font-semibold text-gray-500 uppercase text-xs tracking-wide">Date</th>
                      <th className="px-5 py-3 font-semibold text-gray-500 uppercase text-xs tracking-wide">Plan</th>
                      <th className="px-5 py-3 font-semibold text-gray-500 uppercase text-xs tracking-wide">Amount</th>
                      <th className="px-5 py-3 font-semibold text-gray-500 uppercase text-xs tracking-wide">Status</th>
                      <th className="px-5 py-3 font-semibold text-gray-500 uppercase text-xs tracking-wide">Payment ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((p, i) => (
                      <tr key={p.payment_id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                        <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">
                          {new Date(p.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-block capitalize font-medium text-gray-800 bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-xs border border-blue-100">
                            {p.plan}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-gray-800">
                          ₹{p.amount} <span className="text-xs font-normal text-gray-400">{p.currency}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 border border-green-100 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize">
                            <CheckCircle size={11} />
                            {p.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-400 font-mono text-xs truncate max-w-[160px]">
                          {p.payment_id}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
