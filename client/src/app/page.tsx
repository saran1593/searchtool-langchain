"use client";

import React, { useState, useRef, useEffect } from "react";
import { API_URL } from "../lib/config";
import {
  ArrowUp,
  Sparkles,
  Globe,
  ExternalLink,
  Loader2,
  RotateCw,
  Lightbulb,
} from "lucide-react";

import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/src/components/ui/textarea";
import { Card, CardContent } from "@/src/components/ui/card";

type SearchResponse = {
  answer: string;
  sources: string[];
};

type ChatMessage =
  | {
    id: string;
    role: "user";
    content: string;
    timestamp: Date;
  }
  | {
    id: string;
    role: "assistant";
    content: string;
    sources: string[];
    timestamp: Date;
    isLoading?: boolean;
    error?: string;
  };

const SUGGESTIONS = [
  "What is quantum computing and how does it work?",
  "What are the latest breakthroughs in generative AI models?",
  "Compare the differences between Next.js App Router and Pages Router",
  "Explain the event loop in JavaScript with a simple analogy",
];

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getDomainName = (urlStr: string) => {
    try {
      const url = new URL(urlStr);
      return url.hostname.replace("www.", "");
    } catch {
      return urlStr;
    }
  };

  const handleSearch = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed || trimmed.length < 5) return;

    setIsLoading(true);
    setInput("");
    const userMsgId = Math.random().toString(36).substring(7);
    const assistantMsgId = Math.random().toString(36).substring(7);

    const userMessage: ChatMessage = {
      id: userMsgId,
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    const assistantPlaceholder: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      sources: [],
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);

    try {
      const targetApiUrl = API_URL ? API_URL.trim() : "http://localhost:5000";
      const response = await fetch(`${targetApiUrl}/api/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ q: trimmed }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const data: SearchResponse = await response.json();

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
              ...msg,
              content: data.answer,
              sources: data.sources || [],
              isLoading: false,
            }
            : msg
        )
      );
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
              ...msg,
              error: err.message || "Failed to retrieve search results. Make sure backend is running.",
              isLoading: false,
            }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(input);
  };

  const handleSuggest = (suggestion: string) => {
    handleSearch(suggestion);
  };

  const clearChat = () => {
    setMessages([]);
    setInput("");
  };

  return (
    <div className="flex h-dvh flex-col bg-zinc-50 dark:bg-[#0b0b0c] text-zinc-800 dark:text-zinc-100 transition-colors duration-200">
      <header className="px-6 h-16 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between backdrop-blur-md bg-white/70 dark:bg-[#0b0b0c]/70 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500 text-white dark:bg-indigo-600">
            <Sparkles size={18} />
          </div>
          <span className="font-semibold text-lg tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
            Agent Search
          </span>
        </div>
        {messages.length > 0 && (
          <Button
            onClick={clearChat}
            variant="ghost"
            size="sm"
            className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 font-medium"
          >
            <RotateCw size={14} />
            Reset Chat
          </Button>
        )}
      </header>

      <main className="flex-1 overflow-y-auto flex flex-col items-center">
        {messages.length === 0 ? (
          <div className="flex-1 w-full max-w-2xl px-4 flex flex-col justify-center py-12 md:py-24">
            <div className="text-center mb-8 space-y-3">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-zinc-900 via-indigo-950 to-zinc-950 dark:from-white dark:via-indigo-200 dark:to-zinc-300 bg-clip-text text-transparent">
                Where knowledge begins
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base max-w-md mx-auto">
                Ask a complex question and get a structured summary backed by web research.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mb-8">
              <Card className="shadow-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-2 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything..."
                  rows={2}
                  className="w-full text-zinc-900 dark:text-white bg-transparent outline-none resize-none border-none shadow-none focus-visible:ring-0 focus-visible:border-none p-2.5 text-sm md:text-base placeholder-zinc-400 dark:placeholder-zinc-500 min-h-[60px]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
                <div className="flex items-center justify-between px-3 pt-1 border-t border-zinc-100 dark:border-zinc-800/80 mt-1">
                  <div className="text-[11px] text-zinc-400 dark:text-zinc-500">
                    {input.length < 5 ? (
                      <span className="text-amber-600 dark:text-amber-500/90 font-medium">
                        Min. 5 characters required ({input.length}/5)
                      </span>
                    ) : (
                      <span>Press Enter to search</span>
                    )}
                  </div>
                  <Button
                    type="submit"
                    size="icon-sm"
                    disabled={input.trim().length < 5 || isLoading}
                    className="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 cursor-pointer disabled:opacity-30"
                  >
                    <ArrowUp size={14} />
                  </Button>
                </div>
              </Card>
            </form>

            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider pl-1">
                <Lightbulb size={14} />
                Suggested searches
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SUGGESTIONS.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggest(suggestion)}
                    className="text-left cursor-pointer"
                  >
                    <Card className="h-full border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 hover:bg-zinc-50 dark:hover:bg-zinc-900/80 hover:border-zinc-300 dark:hover:border-zinc-700/80 transition-all shadow-sm">
                      <CardContent className="p-3.5 text-xs md:text-sm text-zinc-600 dark:text-zinc-300 font-medium leading-snug">
                        {suggestion}
                      </CardContent>
                    </Card>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-3xl flex-1 flex flex-col justify-between">
            <div className="flex-1 px-4 py-6 space-y-8">
              {messages.map((message) => {
                if (message.role === "user") {
                  return (
                    <div key={message.id} className="flex justify-end">
                      <div className="max-w-[85%] rounded-2xl bg-zinc-100 dark:bg-zinc-900 px-4 py-3 text-zinc-900 dark:text-zinc-100 border border-zinc-200/50 dark:border-zinc-800/50 text-sm md:text-base whitespace-pre-wrap">
                        {message.content}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={message.id} className="space-y-4">
                    <div className="flex items-center gap-2 pl-0.5">
                      <div className="p-1 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                        <Sparkles size={15} />
                      </div>
                      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        Agent Response
                      </span>
                    </div>

                    {((message.sources && message.sources.length > 0) || message.isLoading) && (
                      <div className="space-y-2 pl-7">
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                          <Globe size={12} />
                          Sources found
                        </div>
                        {message.isLoading ? (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            <div className="h-12 rounded-xl bg-zinc-200/60 dark:bg-zinc-900/60 animate-pulse" />
                            <div className="h-12 rounded-xl bg-zinc-200/60 dark:bg-zinc-900/60 animate-pulse" />
                            <div className="h-12 rounded-xl bg-zinc-200/60 dark:bg-zinc-900/60 animate-pulse" />
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {message.sources.map((src, idx) => (
                              <a
                                key={idx}
                                href={src}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group block"
                              >
                                <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 hover:bg-zinc-50 dark:hover:bg-zinc-900/80 hover:border-zinc-300 dark:hover:border-zinc-700/80 transition-all">
                                  <CardContent className="p-2.5 flex items-center justify-between">
                                    <div className="flex items-center gap-2 overflow-hidden w-full mr-1">
                                      <img
                                        src={`https://www.google.com/s2/favicons?sz=64&domain=${getDomainName(src)}`}
                                        alt=""
                                        className="w-4 h-4 rounded-sm flex-shrink-0 bg-zinc-100"
                                        onError={(e) => {
                                          (e.target as HTMLElement).style.display = "none";
                                        }}
                                      />
                                      <span className="text-xs font-medium truncate text-zinc-600 dark:text-zinc-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                        {getDomainName(src)}
                                      </span>
                                    </div>
                                    <ExternalLink
                                      size={11}
                                      className="text-zinc-400 dark:text-zinc-500 group-hover:text-indigo-500 flex-shrink-0"
                                    />
                                  </CardContent>
                                </Card>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}


                    <div className="pl-7 space-y-3">
                      {message.isLoading ? (
                        <div className="space-y-2.5 animate-pulse max-w-xl">
                          <div className="h-4 bg-zinc-200/70 dark:bg-zinc-900/70 rounded w-full" />
                          <div className="h-4 bg-zinc-200/70 dark:bg-zinc-900/70 rounded w-5/6" />
                          <div className="h-4 bg-zinc-200/70 dark:bg-zinc-900/70 rounded w-4/5" />
                        </div>
                      ) : message.error ? (
                        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                          {message.error}
                        </div>
                      ) : (
                        <div className="text-sm md:text-base leading-relaxed text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap font-sans">
                          {message.content}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="sticky bottom-0 bg-zinc-50 dark:bg-[#0b0b0c] pb-6 pt-2 px-4">
              <form onSubmit={handleSubmit} className="relative max-w-3xl mx-auto">
                <Card className="shadow-md border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-2 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask a follow-up or new question..."
                    rows={1}
                    className="w-full text-zinc-900 dark:text-white bg-transparent outline-none resize-none border-none shadow-none focus-visible:ring-0 focus-visible:border-none p-2.5 pr-14 text-sm md:text-base placeholder-zinc-400 dark:placeholder-zinc-500 min-h-[44px]"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                  />
                  <div className="absolute right-4 bottom-4 flex items-center gap-2">
                    {input.trim().length > 0 && input.trim().length < 5 && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-500/90 font-medium">
                        Min. 5 chars ({input.length}/5)
                      </span>
                    )}
                    <Button
                      type="submit"
                      size="icon-sm"
                      disabled={input.trim().length < 5 || isLoading}
                      className="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 cursor-pointer"
                    >
                      {isLoading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <ArrowUp size={14} />
                      )}
                    </Button>
                  </div>
                </Card>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
