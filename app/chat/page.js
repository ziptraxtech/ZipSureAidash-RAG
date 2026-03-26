"use client";

import { useChat } from "@ai-sdk/react";
import { useRef, useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import Markdown from "react-markdown";
import { Loader2, Trash2, Bot, User } from "lucide-react";

// 1. The actual Chat UI logic
function ChatContent() {
  const searchParams = useSearchParams();
  const deviceId = searchParams.get("device") || "9"; 
  
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const { messages, input, handleInputChange, setMessages } = useChat();

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // FIX: Restore the missing clearChat function
  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem("chat-messages");
  };

  const onHandleSubmit = async (event) => {
    event.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = { 
      id: Date.now().toString(), 
      role: "user", 
      content: input 
    };
    
    setMessages((prev) => [...prev, userMessage]);
    handleInputChange({ target: { value: "" } }); 
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, userMessage],
          deviceId: deviceId 
        }),
      });

      if (!response.ok) throw new Error("Backend connection failed");
      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        { 
          id: (Date.now() + 1).toString(), 
          role: "assistant", 
          content: data.content 
        }
      ]);
    } catch (err) {
      console.error("Chat Error:", err);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 w-full">
      {/* HEADER */}
      <div className="w-full border-b bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Bot className="text-blue-600" />
            <h1 className="font-semibold text-lg text-slate-800 tracking-tight">
              AI Assistant <span className="text-blue-400 text-xs ml-2 font-mono">ID: {deviceId}</span>
            </h1>
          </div>
          <Button variant="ghost" size="sm" onClick={clearChat} className="text-slate-500 hover:text-red-600">
            <Trash2 size={16} className="mr-1" /> Clear
          </Button>
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full flex flex-col p-4">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6 pb-4">
              {messages.map((m) => (
                <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  {m.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                      <Bot size={18} />
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-[15px] ${
                    m.role === "user" ? "bg-blue-600 text-white shadow-md" : "bg-white border border-slate-200 text-slate-800 shadow-sm"
                  }`}>
                    <div className="prose prose-sm max-w-none prose-p:leading-relaxed">
                    <Markdown>{m.content}</Markdown>
                  </div>
                  </div>
                  {m.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white shrink-0">
                      <User size={18} />
                    </div>
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="flex items-center gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-400">
                    <Loader2 className="animate-spin" size={18} />
                  </div>
                  <span className="text-sm text-slate-400">Analyzing charger telemetry...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* INPUT AREA */}
      <div className="w-full bg-white border-t p-4">
        <form className="max-w-4xl mx-auto flex gap-3" onSubmit={onHandleSubmit}>
          <Input
            value={input}
            placeholder="Ask about voltage, energy usage, or charger status..."
            onChange={handleInputChange}
            className="flex-1 h-12 bg-slate-50 border-slate-200 focus-visible:ring-blue-600 rounded-xl"
            disabled={isTyping}
          />
          <Button type="submit" className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl" disabled={isTyping || !input.trim()}>
            {isTyping ? <Loader2 className="animate-spin" size={20} /> : "Send"}
          </Button>
        </form>
      </div>
    </div>
  );
}

// 2. The Export Wrapper with Suspense
export default function Chat() {
  return (
    <Suspense fallback={
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <p className="text-slate-500 font-medium">Loading AI Context...</p>
        </div>
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}