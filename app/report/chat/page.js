"use client";

import { useChat } from "@ai-sdk/react";
import { useRef, useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Markdown from "react-markdown";
import { Loader2, Trash2, Bot, User } from "lucide-react";

const DEVICE_INFO = {
  "1": { name: "Andheria More Charging Hub",    location: "Near Chattarpur Metro, Delhi" },
  "2": { name: "Hauz Khas District Center",     location: 'Near Hauz Khas Metro Station, Delhi' },
  "3": { name: "Qutub Minar Charging Station",  location: 'Near Qutub Minar, Delhi' },
  "4": { name: "TB Hospital Charging Point",    location: 'Near TB Hospital near Qutub Minar, Delhi' },
  "5": { name: "Hauz Khas Metro Gate 1",        location: 'Hauz Khas Metro Gate 1, Delhi' },
  "6": { name: "Piccadily Back Side Parking",   location: "Sector 34, Chandigarh" },
  "7": { name: "Passport Office Front Parking", location: "Sector 34, Chandigarh" },
  "8": { name: "Piccadily Multiplex II",        location: "Sector 34, Chandigarh" },
  "9": { name: "Sapna Cinema",  location: 'Okhla Industrial Estate, Phase III, Delhi' },
};

function makeWelcomeMessage(deviceId) {
  const info = DEVICE_INFO[deviceId] || { name: `Charger ${deviceId}`, location: "Unknown" };
  return {
    id: "welcome",
    role: "assistant",
    content: `Hi! Hope you're having a great day. 👋\n\nWelcome to **ZipSure AI Insights**. I can help you with questions about your charger's telemetry — energy delivered, charging sessions, temperature, current, and more.\n\n📍 **Charger location:** ${info.name}, ${info.location}\n\nHow can I help you today?`,
  };
}

function ChatContent() {
  const searchParams = useSearchParams();
  const deviceId = searchParams.get("device") || "9";

  const [isTyping, setIsTyping]     = useState(false);
  const [sessionId, setSessionId]   = useState(null);
  const [errorMsg, setErrorMsg]     = useState(null);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef(null);
  const { messages, setMessages } = useChat({
    initialMessages: [makeWelcomeMessage(deviceId)],
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, errorMsg]);

  const clearChat = () => {
    setMessages([makeWelcomeMessage(deviceId)]);
    setSessionId(null);
    setErrorMsg(null);
    setInputValue("");
    localStorage.removeItem("chat-messages");
  };

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);
    setErrorMsg(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          deviceId,
          session_id: sessionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Backend connection failed");
      }

      if (data.session_id) setSessionId(data.session_id);

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: data.content },
      ]);
    } catch (err) {
      console.error("Chat Error:", err);
      setErrorMsg(err.message);
    } finally {
      setIsTyping(false);
    }
  };

  const onHandleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 w-full">
      {/* HEADER */}
      <div className="w-full border-b bg-white shadow-sm shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Bot className="text-blue-600" size={20} />
            <h1 className="font-semibold text-base text-slate-800 tracking-tight">
              ZipSure AI Insights
            </h1>
            <span className="text-blue-400 text-xs font-mono bg-blue-50 px-2 py-0.5 rounded-full">
              Charger {deviceId}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearChat}
            className="text-slate-500 hover:text-red-600"
          >
            <Trash2 size={15} className="mr-1" /> Clear
          </Button>
        </div>
      </div>

      {/* SCROLLABLE CHAT AREA */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto w-full">
          <div className="px-4 py-6 space-y-6">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-1">
                    <Bot size={16} />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-[15px] ${
                    m.role === "user"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-white border border-slate-200 text-slate-800 shadow-sm"
                  }`}
                >
                  <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-p:my-1">
                    <Markdown>{m.content}</Markdown>
                  </div>
                </div>
                {m.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white shrink-0 mt-1">
                    <User size={16} />
                  </div>
                )}
              </div>
            ))}

            {/* Error bubble */}
            {errorMsg && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm bg-red-50 border border-red-200 text-red-700">
                  {errorMsg}
                </div>
              </div>
            )}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-400 shrink-0">
                  <Loader2 className="animate-spin" size={16} />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex gap-1 items-center h-4">
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* INPUT AREA */}
      <div className="w-full bg-white border-t shrink-0 p-4">
        <form className="max-w-4xl mx-auto flex gap-3" onSubmit={onHandleSubmit}>
          <Input
            value={inputValue}
            placeholder="Ask about energy, sessions, temperature..."
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1 h-12 bg-slate-50 border-slate-200 focus-visible:ring-blue-600 rounded-xl"
            disabled={isTyping}
          />
          <Button
            type="submit"
            className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
            disabled={isTyping || !inputValue.trim()}
          >
            {isTyping ? <Loader2 className="animate-spin" size={18} /> : "Send"}
          </Button>
        </form>
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
            <p className="text-slate-500 font-medium">Loading AI Context...</p>
          </div>
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
