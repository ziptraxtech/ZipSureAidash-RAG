"use client";

import { useChat } from "@ai-sdk/react";
import { useRef, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import Markdown from "react-markdown";
import { Loader2, Trash2, Bot, User } from "lucide-react";

export default function Chat() {
  // 1. STATE MANAGEMENT
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Load saved messages from localStorage
  const [initialMessages] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("chat-messages");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const {
    messages,
    input,
    handleInputChange,
    setMessages,
  } = useChat({
    initialMessages,
  });

  // 2. SMART SCROLL LOGIC
  // This scrolls to the bottom only when messages or loading state changes
  const prevMessagesLength = useRef(messages.length);

  useEffect(() => {
    // Only scroll to bottom if a new message was added 
    // OR if the AI starts thinking (isTyping becomes true)
    if (messages.length > prevMessagesLength.current || isTyping) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    
    // Update the ref to the current length for the next render
    prevMessagesLength.current = messages.length;
  }, [messages, isTyping]);
    // Save messages to localStorage
  useEffect(() => {
    localStorage.setItem("chat-messages", JSON.stringify(messages));
  }, [messages]);

  // 3. HANDLERS
  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem("chat-messages");
  };

  const onHandleSubmit = async (event) => {
    event.preventDefault();
    if (!input.trim() || isTyping) return;

    // Add user message to UI
    const userMessage = { 
      id: Date.now().toString(), 
      role: "user", 
      content: input 
    };
    
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    
    // Clear the input field immediately
    handleInputChange({ target: { value: "" } }); 
    
    setIsTyping(true); // Show loading indicator

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, userMessage] 
        }),
      });

      if (!response.ok) throw new Error("Backend connection failed");

      const aiText = await response.text();

      // Add assistant message to UI
      setMessages((prev) => [
        ...prev,
        { 
          id: (Date.now() + 1).toString(), 
          role: "assistant", 
          content: aiText 
        }
      ]);
    } catch (err) {
      console.error("Chat Error:", err);
      // Optional: Add an error message to the chat
    } finally {
      setIsTyping(false); // Hide loading indicator
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-200">
      
      {/* HEADER */}
      <div className="w-full border-b bg-white shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Bot className="text-blue-600" />
            <h1 className="font-semibold text-lg">ZipSure AI Assistant</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearChat}
            className="flex items-center gap-1"
          >
            <Trash2 size={14} />
            Clear
          </Button>
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-hidden px-4 py-4">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          <ScrollArea className="flex-1 rounded-xl bg-white shadow p-4 overflow-y-auto">
            <div className="space-y-4 pr-2">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-3 ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {m.role === "assistant" && (
                    <div className="flex items-start">
                      <div className="bg-blue-600 text-white p-2 rounded-full">
                        <Bot size={16} />
                      </div>
                    </div>
                  )}

                  <div
                    className={`max-w-[75%] rounded-xl px-4 py-3 text-sm shadow-sm ${
                      m.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <div className="leading-relaxed whitespace-pre-wrap">
                      <Markdown>{m.content}</Markdown>
                    </div>
                  </div>

                  {m.role === "user" && (
                    <div className="flex items-start">
                      <div className="bg-black text-white p-2 rounded-full">
                        <User size={16} />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Loading indicator inside the scrollable area */}
              {isTyping && (
                <div className="flex items-center gap-2 text-gray-500 py-2">
                  <Loader2 className="animate-spin" size={18} />
                  <span className="text-xs italic">ZipSure AI is thinking...</span>
                </div>
              )}

              {/* Invisible anchor for scrolling */}
              <div ref={messagesEndRef} className="h-1" />
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* INPUT AREA */}
      <div className="w-full border-t bg-white">
        <form
          className="max-w-4xl mx-auto px-4 py-4"
          onSubmit={onHandleSubmit}
        >
          <div className="flex gap-2">
            <Input
              value={input}
              placeholder="Ask about charger analytics..."
              onChange={handleInputChange}
              className="flex-1"
              disabled={isTyping}
            />
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isTyping || !input.trim()}
            >
              {isTyping ? <Loader2 className="animate-spin" size={18} /> : "Send"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}