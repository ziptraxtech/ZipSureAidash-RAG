"use client";

import { useRef, useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Markdown from "react-markdown";
import { Loader2, Trash2, Bot, User, Send, Zap, MapPin, ChevronLeft } from "lucide-react";
import Link from "next/link";

const DEVICE_INFO = {
  "1": { name: "Andheria More Charging Hub",    location: "Near Chattarpur Metro, Delhi" },
  "2": { name: "Hauz Khas District Center",     location: "Hauz Khas Metro Station, Delhi" },
  "3": { name: "Qutub Minar Charging Station",  location: "Qutub Minar, Delhi" },
  "4": { name: "TB Hospital Charging Point",    location: "TB Hospital near Qutub Minar, Delhi" },
  "5": { name: "Hauz Khas Metro Gate 1",        location: "Hauz Khas Metro Gate 1, Delhi" },
  "6": { name: "Piccadily Back Side Parking",   location: "Sector 34, Chandigarh" },
  "7": { name: "Passport Office Front Parking", location: "Sector 34, Chandigarh" },
  "8": { name: "Piccadily Multiplex II",        location: "Sector 34, Chandigarh" },
  "9": { name: "Sapna Cinema, Okhla",           location: "Okhla Industrial Estate, Phase III, Delhi" },
};

const SUGGESTED_QUESTIONS = [
  "What was the total energy delivered today?",
  "How many charging sessions have there been?",
  "What is the current state of charge?",
  "When was the charger last active?",
];

function makeWelcomeMessage(deviceId) {
  const info = DEVICE_INFO[deviceId] || { name: `Charger ${deviceId}`, location: "Unknown" };
  return {
    id: "welcome",
    role: "assistant",
    content: `Hi! Hope you're having a great day. 👋\n\nWelcome to **ZipSure AI Insights**. I can help you with questions about your charger's telemetry — energy delivered, charging sessions, temperature, current, and more.\n\n📍 **${info.name}**, ${info.location}\n\nHow can I help you today?`,
    createdAt: null,
  };
}

function formatTime(date) {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function TypingDots() {
  return (
    <div className="flex gap-1.5 items-center h-5 px-1">
      <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
      <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:160ms]" />
      <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:320ms]" />
    </div>
  );
}

function ChatContent() {
  const searchParams = useSearchParams();
  const deviceId = searchParams.get("device") || "9";
  const info = DEVICE_INFO[deviceId] || { name: `Charger ${deviceId}`, location: "Unknown" };

  const [messages, setMessages]     = useState(() => [makeWelcomeMessage(deviceId)]);
  const [isTyping, setIsTyping]     = useState(false);
  const [sessionId, setSessionId]   = useState(null);
  const [errorMsg, setErrorMsg]     = useState(null);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, errorMsg]);

  const clearChat = () => {
    setMessages([makeWelcomeMessage(deviceId)]);
    setSessionId(null);
    setErrorMsg(null);
    setInputValue("");
  };

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: trimmed,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);
    setErrorMsg(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage], deviceId, session_id: sessionId }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Backend connection failed");
      if (data.session_id) setSessionId(data.session_id);

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: data.content, createdAt: new Date() },
      ]);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsTyping(false);
    }
  };

  const showSuggestions = messages.length === 1;

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">

      {/* ── Left sidebar ───────────────────────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col w-72 shrink-0 border-r border-slate-200/80"
        style={{ background: "linear-gradient(160deg, #1e3a8a 0%, #1d4ed8 60%, #2563eb 100%)" }}
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
              <Zap size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">ZipSure AI</p>
              <p className="text-blue-300 text-[10px] font-medium tracking-wide uppercase">Insights</p>
            </div>
          </div>
        </div>

        {/* Charger info */}
        <div className="px-5 py-5 border-b border-white/10">
          <p className="text-blue-300 text-[10px] font-bold uppercase tracking-widest mb-3">Active Charger</p>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/15">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center mt-0.5 shrink-0">
                <MapPin size={14} className="text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm leading-snug">{info.name}</p>
                <p className="text-blue-300 text-[11px] mt-0.5 leading-snug">{info.location}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-300 text-[11px] font-medium">Connected · Charger {deviceId}</span>
            </div>
          </div>
        </div>

        {/* Suggestions */}
        <div className="px-5 py-4 flex-1">
          <p className="text-blue-300 text-[10px] font-bold uppercase tracking-widest mb-3">Quick Questions</p>
          <div className="space-y-2">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                disabled={isTyping}
                className="w-full text-left text-[12px] text-blue-100 hover:text-white bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/20 rounded-xl px-3 py-2.5 transition-all duration-200 leading-snug disabled:opacity-40"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/10">
          <Link
            href={`/report/dashboard?device=${deviceId}`}
            className="flex items-center gap-2 text-blue-300 hover:text-white text-xs font-medium transition-colors"
          >
            <ChevronLeft size={14} />
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* ── Main chat area ─────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 bg-white">

        {/* Header */}
        <div className="shrink-0 border-b border-slate-200/80 bg-white px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile back */}
            <Link
              href={`/report/dashboard?device=${deviceId}`}
              className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
            >
              <ChevronLeft size={18} />
            </Link>

            {/* Avatar */}
            <div className="relative">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center border border-blue-100"
                style={{ background: "linear-gradient(135deg, #dbeafe, #bfdbfe)" }}
              >
                <Bot size={17} className="text-blue-600" />
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white" />
            </div>

            <div>
              <p className="font-semibold text-slate-800 text-sm leading-tight">ZipSure AI</p>
              <p className="text-[11px] text-emerald-500 font-medium leading-tight">Online · Ready to help</p>
            </div>
          </div>

          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-500 hover:bg-red-50 border border-slate-200 hover:border-red-200 px-3 py-1.5 rounded-full transition-all"
          >
            <Trash2 size={12} />
            Clear chat
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50">
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

            {messages.map((m) => (
              <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>

                {m.role === "assistant" && (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 border border-blue-100"
                    style={{ background: "linear-gradient(135deg, #dbeafe, #bfdbfe)" }}
                  >
                    <Bot size={15} className="text-blue-600" />
                  </div>
                )}

                <div className={`flex flex-col gap-1 ${m.role === "user" ? "items-end" : "items-start"} max-w-[78%]`}>
                  <div
                    className={`rounded-2xl px-4 py-3 text-[14px] leading-relaxed shadow-sm ${
                      m.role === "user"
                        ? "text-white rounded-tr-sm"
                        : "bg-white text-slate-700 border border-slate-200/80 rounded-tl-sm"
                    }`}
                    style={m.role === "user" ? { background: "linear-gradient(135deg, #2563eb, #1d4ed8)" } : {}}
                  >
                    <div className="prose prose-sm max-w-none prose-p:my-1 prose-p:leading-relaxed prose-headings:font-semibold prose-headings:text-slate-800 prose-strong:text-slate-800">
                      <Markdown>{m.content}</Markdown>
                    </div>
                  </div>
                  {m.createdAt && (
                    <span className="text-[11px] text-slate-400 px-1">{formatTime(m.createdAt)}</span>
                  )}
                </div>

                {m.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white shrink-0 mt-1">
                    <User size={14} />
                  </div>
                )}
              </div>
            ))}

            {/* Inline suggested questions — only shown on the welcome screen */}
            {showSuggestions && (
              <div className="flex flex-wrap gap-2 pl-11">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 px-3 py-1.5 rounded-full transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {errorMsg && (
              <div className="flex justify-start pl-11">
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 max-w-[78%]">
                  {errorMsg}
                </div>
              </div>
            )}

            {isTyping && (
              <div className="flex items-end gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-blue-100"
                  style={{ background: "linear-gradient(135deg, #dbeafe, #bfdbfe)" }}
                >
                  <Bot size={15} className="text-blue-600" />
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl rounded-tl-sm px-4 py-3.5 shadow-sm">
                  <TypingDots />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="shrink-0 bg-white border-t border-slate-200/80 px-4 pt-4 pb-3">
          <div className="max-w-3xl mx-auto">
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(inputValue); }}
              className="flex items-center gap-3"
            >
              <input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(inputValue); }
                }}
                placeholder="Ask about energy, sessions, temperature..."
                disabled={isTyping}
                className="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-full px-5 py-3.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 disabled:opacity-50 placeholder-slate-400 transition-all"
              />
              <button
                type="submit"
                disabled={isTyping || !inputValue.trim()}
                className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 disabled:opacity-40 transition-all hover:scale-105 active:scale-95 shadow-md"
                style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
              >
                {isTyping
                  ? <Loader2 size={16} className="text-white animate-spin" />
                  : <Send size={15} className="text-white translate-x-[1px]" />
                }
              </button>
            </form>
            <p className="text-center text-[11px] text-slate-400 mt-2.5">
              Powered by <span className="font-semibold text-blue-500">ZipSure AI</span> · Charger telemetry analysis
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Chat() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-full flex items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <p className="text-slate-500 font-medium text-sm">Loading AI Context...</p>
          </div>
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
