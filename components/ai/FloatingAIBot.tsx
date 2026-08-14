"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Sparkles, X, Send, Bot, Loader2, Maximize2 } from "lucide-react";

export function FloatingAIBot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content: "Hello! I am your SkillSwap AI Assistant powered by Google Gemini. How can I help with your skills or learning plan today?",
    },
  ]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await res.json();
      if (data.success && data.message) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.message || "Sorry, I couldn't process your question right now." },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "An error occurred while connecting to Gemini AI." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {!open ? (
        <Button
          onClick={() => setOpen(true)}
          className="h-13 px-4 rounded-full bg-gradient-to-r from-emerald-700 via-teal-800 to-teal-900 hover:from-emerald-800 hover:to-teal-950 text-white shadow-xl flex items-center gap-2 border border-emerald-500/40 animate-bounce-subtle"
        >
          <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-400/40">
            <Sparkles className="h-4 w-4 text-amber-300" />
          </div>
          <span className="text-xs font-bold tracking-wide pr-1">Ask AI Assistant</span>
        </Button>
      ) : (
        <Card className="w-[360px] sm:w-[400px] h-[480px] shadow-2xl border-emerald-500/30 flex flex-col bg-card animate-in slide-in-from-bottom-5 duration-200">
          <CardHeader className="p-3.5 bg-gradient-to-r from-teal-900 to-emerald-900 text-white rounded-t-xl flex flex-row items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-amber-500/20 flex items-center justify-center border border-amber-300/30">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              </div>
              <div>
                <CardTitle className="text-xs font-bold text-white flex items-center gap-1.5">
                  SkillSwap AI Assistant
                </CardTitle>
                <p className="text-[10px] text-emerald-200">Powered by Google Gemini</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-emerald-200 hover:text-white hover:bg-white/10"
                title="Open Fullscreen"
              >
                <Link href="/ai-assistant">
                  <Maximize2 className="h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                className="h-7 w-7 text-emerald-200 hover:text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-3 flex-1 overflow-y-auto space-y-3 text-xs">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                )}
                <div
                  className={`p-2.5 rounded-2xl max-w-[82%] text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-muted text-foreground rounded-tl-none border border-border/60"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 shrink-0">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="p-2.5 rounded-2xl bg-muted text-muted-foreground text-xs flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> Gemini AI is thinking...
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="p-2.5 border-t border-border bg-card">
            <form onSubmit={handleSend} className="flex gap-2 w-full">
              <Input
                placeholder="Ask for skill advice or learning plan..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="text-xs h-9"
              />
              <Button type="submit" size="icon" disabled={loading || !input.trim()} className="h-9 w-9 shrink-0">
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
