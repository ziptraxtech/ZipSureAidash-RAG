"use client";

import { useRef, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Markdown from "react-markdown";
import { Bot, User, X, MessageCircle, Maximize2, Send, Zap } from "lucide-react";
import Link from "next/link";

const DEVICE_INFO = {
  "1": { name: "Andheria More Charging Hub",    location: "Near Chattarpur Metro, Delhi" },
  "2": { name: "Hauz Khas District Center",     location: "Near Hauz Khas Metro Station, Delhi" },
  "3": { name: "Qutub Minar Charging Station",  location: "Near Qutub Minar, Delhi" },
  "4": { name: "TB Hospital Charging Point",    location: "Near TB Hospital near Qutub Minar, Delhi" },
  "5": { name: "Hauz Khas Metro Gate 1",        location: "Hauz Khas Metro Gate 1, Delhi" },
  "6": { name: "Piccadily Back Side Parking",   location: "Sector 34, Chandigarh" },
  "7": { name: "Passport Office Front Parking", location: "Sector 34, Chandigarh" },
  "8": { name: "Piccadily Multiplex II",        location: "Sector 34, Chandigarh" },
  "9": { name: "Sapna Cinema, Okhla",           location: "Okhla Industrial Estate, Phase III, Delhi" },
};

function makeWelcomeMessage(deviceId) {
  const info = DEVICE_INFO[deviceId] || { name: `Charger ${deviceId}`, location: "Unknown" };
  return {
    id: "welcome",
    role: "assistant",
    content: `Hi! Hope you're having a great day. 👋\n\nWelcome to **ZipSure AI Insights**. Ask me anything about this charger — energy, sessions, temperature, and more.\n\n📍 **${info.name}**, ${info.location}\n\nHow can I help you?`,
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
    <div className="flex gap-1 items-center h-4 px-1">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:160ms]" />
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:320ms]" />
    </div>
  );
}

// Inner component — owns all hooks, only mounted when on the correct route
function ChatbotPopupInner({ deviceId }) {
  const [open, setOpen]             = useState(false);
  const [isTyping, setIsTyping]     = useState(false);

  // Auto-open after 5 seconds on first mount
  useEffect(() => {
    const timer = setTimeout(() => setOpen(true), 5000);
    return () => clearTimeout(timer);
  }, []);
  const [sessionId, setSessionId]   = useState(null);
  const [errorMsg, setErrorMsg]     = useState(null);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const STORAGE_KEY = `zipai_chat_${deviceId}`;

  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { messages: saved_msgs } = JSON.parse(saved);
        return saved_msgs.map(m => ({ ...m, createdAt: m.createdAt ? new Date(m.createdAt) : null }));
      }
    } catch {}
    return [makeWelcomeMessage(deviceId)];
  });

  // Restore sessionId from storage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { sessionId: saved_sid } = JSON.parse(saved);
        if (saved_sid) setSessionId(saved_sid);
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist messages + sessionId to sessionStorage on every change
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, sessionId }));
    } catch {}
  }, [messages, sessionId, STORAGE_KEY]);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [messages, isTyping, open]);

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

  const info = DEVICE_INFO[deviceId] || { name: `Charger ${deviceId}` };

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
        style={{ background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)" }}
        aria-label="Open AI assistant"
      >
        <div className={`transition-all duration-200 ${open ? "rotate-90 opacity-0 absolute" : "rotate-0 opacity-100"}`}>
          <MessageCircle size={22} className="text-white" />
        </div>
        <div className={`transition-all duration-200 ${open ? "rotate-0 opacity-100" : "-rotate-90 opacity-0 absolute"}`}>
          <X size={22} className="text-white" />
        </div>
      </button>

      {/* Unread badge */}
      {!open && (
        <span className="fixed bottom-[4.5rem] right-5 z-50 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white text-white text-[10px] font-bold flex items-center justify-center shadow-md">
          AI
        </span>
      )}

      {/* Popup panel */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-[390px] max-w-[calc(100vw-24px)] flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-slate-200/60 transition-all duration-300 origin-bottom-right ${
          open
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-95 pointer-events-none"
        }`}
        style={{ height: "540px", maxHeight: "calc(100vh - 120px)" }}
      >
        {/* Header */}
        <div
          className="shrink-0 px-4 py-3.5 flex items-center justify-between"
          style={{ background: "linear-gradient(135deg, #1e40af 0%, #2563eb 60%, #3b82f6 100%)" }}
        >
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center border border-white/30">
                <Zap size={16} className="text-white" />
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#2563eb]" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">ZipSure AI</p>
              <p className="text-blue-200 text-[11px] leading-tight">{info.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href={`/stations/chat?device=${deviceId}`}
              title="Open full chat"
              className="text-blue-200 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <Maximize2 size={14} />
            </Link>
            <button
              onClick={() => setOpen(false)}
              className="text-blue-200 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto bg-[#f8fafc] px-3 py-4 space-y-4">
          {messages.map((m) => (
            <div key={m.id} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 border border-blue-100"
                  style={{ background: "linear-gradient(135deg, #dbeafe, #eff6ff)" }}>
                  <Bot size={13} className="text-blue-600" />
                </div>
              )}

              <div className={`flex flex-col gap-1 ${m.role === "user" ? "items-end" : "items-start"} max-w-[82%]`}>
                <div
                  className={`rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm ${
                    m.role === "user"
                      ? "text-white rounded-tr-sm"
                      : "bg-white text-slate-700 border border-slate-200/80 rounded-tl-sm"
                  }`}
                  style={m.role === "user" ? { background: "linear-gradient(135deg, #2563eb, #1d4ed8)" } : {}}
                >
                  <div className="prose prose-sm max-w-none prose-p:my-0.5 prose-p:leading-snug prose-headings:text-slate-800">
                    <Markdown>{m.content}</Markdown>
                  </div>
                </div>
                {m.createdAt && (
                  <span className="text-[10px] text-slate-400 px-1">{formatTime(m.createdAt)}</span>
                )}
              </div>

              {m.role === "user" && (
                <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-white shrink-0 mt-0.5">
                  <User size={12} />
                </div>
              )}
            </div>
          ))}

          {errorMsg && (
            <div className="mx-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {errorMsg}
            </div>
          )}

          {isTyping && (
            <div className="flex gap-2 items-end">
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 border border-blue-100"
                style={{ background: "linear-gradient(135deg, #dbeafe, #eff6ff)" }}>
                <Bot size={13} className="text-blue-600" />
              </div>
              <div className="bg-white border border-slate-200/80 rounded-2xl rounded-tl-sm px-3.5 py-3 shadow-sm">
                <TypingDots />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="shrink-0 bg-white border-t border-slate-200/80 px-3 pt-3 pb-2">
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(inputValue); }}
            className="flex gap-2 items-center"
          >
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(inputValue); }
              }}
              placeholder="Ask about this charger..."
              disabled={isTyping}
              className="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 disabled:opacity-50 placeholder-slate-400 transition-all"
            />
            <button
              type="submit"
              disabled={isTyping || !inputValue.trim()}
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 disabled:opacity-40 transition-all hover:scale-105 active:scale-95"
              style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
            >
              <Send size={14} className="text-white translate-x-[1px]" />
            </button>
          </form>
          <p className="text-center text-[10px] text-slate-400 mt-2 mb-0.5">
            Powered by <span className="font-semibold text-blue-500">ZipSure AI</span>
          </p>
        </div>
      </div>
    </>
  );
}

// Outer guard — only mounts the inner component on /report/* pages
const REPORT_PATHS = ["/stations/dashboard", "/stations/analytics", "/stations/reports", "/stations/payment-plans"];
export default function ChatbotPopup({ deviceId = "9" }) {
  const pathname = usePathname();
  if (!REPORT_PATHS.some(p => pathname.startsWith(p))) return null;
  return <ChatbotPopupInner deviceId={deviceId} />;
}
