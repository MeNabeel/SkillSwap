"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  User,
  RefreshCw,
  AlertCircle,
  BookOpen,
  Compass,
  HelpCircle,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Message {
  id: string;
  sender: "user" | "ai";
  content: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  {
    icon: Lightbulb,
    label: "What should I learn next?",
    prompt: "What should I learn next based on my skills and goals?",
  },
  {
    icon: BookOpen,
    label: "Suggest a learning path",
    prompt: "Based on my skills, suggest a step-by-step learning path.",
  },
  {
    icon: Compass,
    label: "Explain Docker to me",
    prompt: "Explain Docker to me and why it is useful for developers.",
  },
  {
    icon: ArrowRight,
    label: "After React, what's next?",
    prompt: "I know React. What should I learn after it?",
  },
  {
    icon: Lightbulb,
    label: "Profile skill recommendations",
    prompt: "What skills should I add to my SkillSwap profile?",
  },
  {
    icon: HelpCircle,
    label: "How SkillSwap works",
    prompt: "How does SkillSwap work and how do I exchange skills?",
  },
];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      sender: "ai",
      content:
        "Hello! I am your SkillSwap AI Assistant 👋\n\nI have reviewed your profile and current skills. I can help you with:\n- Personalized skill recommendations based on what you teach & want to learn\n- Step-by-step learning paths for technical & design subjects\n- In-depth explanations of frameworks, tools, and algorithms\n- SkillSwap guidance on finding exchange partners and crafting requests\n\nHow can I help your learning journey today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    setErrorMessage(null);
    const userMsgId = `user-${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const newUserMsg: Message = {
      id: userMsgId,
      sender: "user",
      content: text,
      timestamp,
    };

    setMessages((prev) => [...prev, newUserMsg]);
    if (!textToSend) setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: text }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const errorMsg = data.message || "Failed to get AI response. Please try again.";
        setErrorMessage(errorMsg);
        toast.error("AI Assistant Error", { description: errorMsg });
        return;
      }

      const aiMsgId = `ai-${Date.now()}`;
      const newAiMsg: Message = {
        id: aiMsgId,
        sender: "ai",
        content: data.message,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, newAiMsg]);
    } catch (err: any) {
      console.error("AI Assistant client error:", err);
      const networkError = "Network error while connecting to SkillSwap AI. Please check your connection.";
      setErrorMessage(networkError);
      toast.error("Network Error", { description: networkError });
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handleQuickPromptClick = (promptText: string) => {
    setInputMessage(promptText);
    handleSendMessage(promptText);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: "ai",
        content:
          "Chat reset! I am ready for your next question regarding skill recommendations, learning guidance, or SkillSwap features.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setErrorMessage(null);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-6">
      {/* Top Header Card */}
      <Card className="border border-border/80 shadow-sm bg-card">
        <CardHeader className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-sm shrink-0">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl font-bold text-foreground">
                  SkillSwap AI Assistant
                </CardTitle>
                <Badge variant="secondary" className="bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200/50 text-[11px] font-medium">
                  <Sparkles className="h-3 w-3 mr-1 text-violet-500 inline" /> Powered by OpenAI
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Get personalized guidance based on your real skills, teaching goals, and academic interest.
              </CardDescription>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleClearChat}
            className="text-xs h-8 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Clear Conversation
          </Button>
        </CardHeader>
      </Card>

      {/* Main Chat Interface Container */}
      <Card className="border border-border shadow-sm bg-card flex flex-col h-[650px] min-h-[500px]">
        {/* Messages Container */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.sender === "ai" && (
                  <div className="h-8 w-8 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0 border border-primary/20 mt-0.5">
                    <Sparkles className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-sm shadow-xs ${
                    msg.sender === "user"
                      ? "bg-primary text-primary-foreground rounded-br-xs"
                      : "bg-muted/70 text-foreground border border-border/60 rounded-bl-xs"
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed space-y-2">
                    {msg.content}
                  </div>
                  <div
                    className={`text-[10px] mt-2 text-right ${
                      msg.sender === "user"
                        ? "text-primary-foreground/75"
                        : "text-muted-foreground"
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {msg.sender === "user" && (
                  <div className="h-8 w-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0 border border-border mt-0.5">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {/* AI Typing / Skeleton State */}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="h-8 w-8 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0 border border-primary/20 mt-0.5">
                  <Sparkles className="h-4 w-4 animate-spin" />
                </div>
                <div className="bg-muted/70 text-foreground border border-border/60 rounded-2xl rounded-bl-xs p-4 w-64 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">SkillSwap AI is thinking...</span>
                  </div>
                  <Skeleton className="h-3.5 w-full bg-muted-foreground/20" />
                  <Skeleton className="h-3.5 w-3/4 bg-muted-foreground/20" />
                </div>
              </div>
            )}

            {/* Error Alert Box if API returns error */}
            {errorMessage && (
              <div className="my-2 p-3.5 rounded-xl border border-destructive/50 bg-destructive/10 text-destructive flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-semibold">AI Request Error</h5>
                  <p className="text-xs mt-0.5">{errorMessage}</p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2.5 border-t border-border/50 bg-muted/20">
          <p className="text-[11px] font-medium text-muted-foreground mb-2 flex items-center gap-1">
            <Lightbulb className="h-3 w-3 text-amber-500 inline" /> Quick Prompts:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((item, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickPromptClick(item.prompt)}
                className="text-xs bg-background hover:bg-muted border border-border hover:border-primary/40 text-foreground px-2.5 py-1 rounded-full transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
              >
                <item.icon className="h-3 w-3 text-primary shrink-0" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Input Controls Form */}
        <div className="p-4 border-t border-border bg-card">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask SkillSwap AI for skill recommendations, learning paths, or help..."
                disabled={isLoading}
                maxLength={1000}
                className="pr-12 text-sm bg-background border-border focus:ring-2 focus:ring-primary/20"
              />
              <span className="absolute right-3 top-2.5 text-[10px] text-muted-foreground font-mono">
                {inputMessage.length}/1000
              </span>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm px-4"
            >
              <Send className="h-4 w-4 mr-1" />
              <span>Send</span>
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
