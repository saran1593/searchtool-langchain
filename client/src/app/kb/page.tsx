"use client";

import React, { useState, useRef, useEffect } from "react";
import { API_URL } from "../../lib/config";
import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/src/components/ui/textarea";
import { Card, CardContent } from "@/src/components/ui/card";
import {
    BookOpen,
    Send,
    RefreshCw,
    CheckCircle,
    AlertCircle,
    Loader2,
    Layers,
    Trash2,
    FileText,
    Sparkles,
    Info,
    ChevronDown,
    ChevronUp
} from "lucide-react";

type Source = {
    source: string;
    chunkId: number;
};

type ChatMessage = {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    confidence?: number;
    sources?: Source[];
    isLoading?: boolean;
    error?: string;
};

type IngestResult = {
    ok: boolean;
    docCount: number;
    chunkcount: number;
    source: string;
};

export default function LightRagKb() {
    // Ingestion State
    const [ingestTextValue, setIngestTextValue] = useState("");
    const [sourceName, setSourceName] = useState("");
    const [isIngesting, setIsIngesting] = useState(false);
    const [ingestResult, setIngestResult] = useState<IngestResult | null>(null);
    const [ingestError, setIngestError] = useState<string | null>(null);

    // Reset State
    const [isResetting, setIsResetting] = useState(false);
    const [resetMessage, setResetMessage] = useState<string | null>(null);

    // Chat State
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [isAsking, setIsAsking] = useState(false);
    const [kValue, setKValue] = useState(4);
    const [expandedSourceMsgId, setExpandedSourceMsgId] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const targetApiUrl = (API_URL ? API_URL.trim() : "http://localhost:5000") + "/kb";

    // Scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Handle Ingest
    const handleIngest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ingestTextValue.trim()) return;

        setIsIngesting(true);
        setIngestResult(null);
        setIngestError(null);
        setResetMessage(null);

        try {
            const response = await fetch(`${targetApiUrl}/ingest`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    text: ingestTextValue.trim(),
                    source: sourceName.trim() || undefined,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Server responded with status ${response.status}`);
            }

            const data = await response.json();
            setIngestResult({
                ok: true,
                docCount: data.docCount,
                chunkcount: data.chunkcount,
                source: data.source || "pasted text",
            });
            setIngestTextValue("");
            setSourceName("");
        } catch (err: any) {
            setIngestError(err.message || "Failed to ingest document");
        } finally {
            setIsIngesting(false);
        }
    };

    // Handle Reset Store
    const handleReset = async () => {
        if (!confirm("Are you sure you want to completely clear the Knowledge Base? This cannot be undone.")) {
            return;
        }

        setIsResetting(true);
        setResetMessage(null);
        setIngestError(null);
        setIngestResult(null);

        try {
            const response = await fetch(`${targetApiUrl}/reset`, {
                method: "POST",
            });

            if (!response.ok) {
                throw new Error(`Server responded with status ${response.status}`);
            }

            const data = await response.json();
            setResetMessage(data.message || "Knowledge Base reset successfully");
        } catch (err: any) {
            setIngestError(err.message || "Failed to reset Knowledge Base");
        } finally {
            setIsResetting(false);
        }
    };

    // Handle Chat Query
    const handleQuery = async (e: React.FormEvent) => {
        e.preventDefault();
        const queryText = chatInput.trim();
        if (!queryText || queryText.length < 3) return;

        setChatInput("");
        setIsAsking(true);
        setResetMessage(null);

        const userMsgId = Math.random().toString(36).substring(7);
        const assistantMsgId = Math.random().toString(36).substring(7);

        const userMessage: ChatMessage = {
            id: userMsgId,
            role: "user",
            content: queryText,
            timestamp: new Date(),
        };

        const assistantPlaceholder: ChatMessage = {
            id: assistantMsgId,
            role: "assistant",
            content: "",
            timestamp: new Date(),
            isLoading: true,
        };

        setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);

        try {
            const response = await fetch(`${targetApiUrl}/ask`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    query: queryText,
                    k: kValue,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Server responded with status ${response.status}`);
            }

            const data = await response.json();

            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === assistantMsgId
                        ? {
                            ...msg,
                            content: data.answer,
                            confidence: data.confidence,
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
                            error: err.message || "Failed to query the Knowledge Base.",
                            isLoading: false,
                        }
                        : msg
                )
            );
        } finally {
            setIsAsking(false);
        }
    };

    return (
        <div className="flex h-screen w-full bg-zinc-50 dark:bg-[#0b0b0c] text-zinc-900 dark:text-zinc-100 overflow-hidden font-sans">
            {/* Left Partition: Ingest Knowledge */}
            <div className="w-1/2 h-full border-r border-zinc-200 dark:border-zinc-800 flex flex-col p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                            <BookOpen size={20} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-zinc-950 to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
                                Knowledge Ingestion
                            </h1>
                            <p className="text-xs text-zinc-500">Add documents to your custom agent memory</p>
                        </div>
                    </div>
                    <Button
                        onClick={handleReset}
                        variant="ghost"
                        size="sm"
                        disabled={isResetting || isIngesting}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 font-medium text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                        {isResetting ? (
                            <Loader2 size={13} className="animate-spin" />
                        ) : (
                            <Trash2 size={13} />
                        )}
                        Clear KB
                    </Button>
                </div>

                <form onSubmit={handleIngest} className="space-y-4 flex-1 flex flex-col">
                    <div className="space-y-1.5 flex-1 flex flex-col">
                        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 pl-1">
                            Document Text
                        </label>
                        <Textarea
                            value={ingestTextValue}
                            onChange={(e) => setIngestTextValue(e.target.value)}
                            placeholder="Paste or write paragraphs of reference documentation here to vectorize and store..."
                            className="flex-1 min-h-[250px] p-4 text-sm resize-none rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
                            disabled={isIngesting || isResetting}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 pl-1">
                            Source Name (Optional)
                        </label>
                        <input
                            type="text"
                            value={sourceName}
                            onChange={(e) => setSourceName(e.target.value)}
                            placeholder="e.g. project_wiki.txt, api_spec.md"
                            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-50"
                            disabled={isIngesting || isResetting}
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={isIngesting || isResetting || !ingestTextValue.trim()}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl shadow-md shadow-indigo-600/10 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isIngesting ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Ingesting and Chunking...
                            </>
                        ) : (
                            <>
                                <Layers size={16} />
                                Ingest Document
                            </>
                        )}
                    </Button>
                </form>

                {/* Results / Status Feedbacks */}
                <div className="mt-6 space-y-3">
                    {ingestResult && (
                        <Card className="border-emerald-500/20 bg-emerald-500/5 text-emerald-800 dark:text-emerald-400">
                            <CardContent className="p-4 flex gap-3 items-start">
                                <CheckCircle size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                                <div className="text-xs space-y-1">
                                    <p className="font-semibold text-sm">Successfully Ingested!</p>
                                    <p>Document source: <strong className="font-mono">{ingestResult.source}</strong></p>
                                    <p>Created chunks: <strong className="font-semibold">{ingestResult.chunkcount}</strong></p>
                                    <p>Total documents: <strong className="font-semibold">{ingestResult.docCount}</strong></p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {resetMessage && (
                        <Card className="border-amber-500/20 bg-amber-500/5 text-amber-800 dark:text-amber-400">
                            <CardContent className="p-4 flex gap-3 items-start">
                                <CheckCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                                <div className="text-xs space-y-1">
                                    <p className="font-semibold text-sm">Reset Complete</p>
                                    <p>{resetMessage}</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {ingestError && (
                        <Card className="border-red-500/20 bg-red-500/5 text-red-800 dark:text-red-400">
                            <CardContent className="p-4 flex gap-3 items-start">
                                <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                                <div className="text-xs space-y-1">
                                    <p className="font-semibold text-sm">Ingestion Error</p>
                                    <p>{ingestError}</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Right Partition: Query Chat Box */}
            <div className="w-1/2 h-full flex flex-col bg-zinc-50/50 dark:bg-[#0c0c0e]">
                <header className="px-6 h-[73px] border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold">KB Chat Assistant</h2>
                            <p className="text-[10px] text-zinc-500">Query your custom vectorized store</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Retrievals (k):</span>
                        <select
                            value={kValue}
                            onChange={(e) => setKValue(Number(e.target.value))}
                            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs px-2 py-1 focus:outline-none"
                        >
                            {[2, 3, 4, 5, 6, 8, 10].map((num) => (
                                <option key={num} value={num}>
                                    {num} chunks
                                </option>
                            ))}
                        </select>
                    </div>
                </header>

                {/* Chat History Pane */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-3 px-6">
                            <div className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500">
                                <FileText size={24} />
                            </div>
                            <h3 className="font-semibold text-zinc-700 dark:text-zinc-300">No Query History</h3>
                            <p className="text-xs text-zinc-500 max-w-xs">
                                Ingest some documentation in the left panel first, then ask specific questions here to see retrieval in action.
                            </p>
                        </div>
                    ) : (
                        messages.map((message) => {
                            if (message.role === "user") {
                                return (
                                    <div key={message.id} className="flex justify-end">
                                        <div className="max-w-[85%] rounded-2xl bg-zinc-900 dark:bg-zinc-800 text-white dark:text-zinc-100 px-4 py-3 text-sm shadow-sm">
                                            {message.content}
                                        </div>
                                    </div>
                                );
                            }

                            // Assistant message
                            return (
                                <div key={message.id} className="space-y-3">
                                    <div className="flex items-center gap-2 pl-0.5">
                                        <div className="p-1 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                                            <Sparkles size={13} />
                                        </div>
                                        <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                                            Knowledge Match
                                        </span>
                                        {message.confidence !== undefined && (
                                            <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full ml-auto">
                                                Confidence: {(message.confidence * 100).toFixed(0)}%
                                            </span>
                                        )}
                                    </div>

                                    <div className="pl-6 space-y-3">
                                        {message.isLoading ? (
                                            <div className="space-y-2 animate-pulse max-w-md">
                                                <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
                                                <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-5/6" />
                                                <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3" />
                                            </div>
                                        ) : message.error ? (
                                            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
                                                {message.error}
                                            </div>
                                        ) : (
                                            <div className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">
                                                {message.content}
                                            </div>
                                        )}

                                        {/* Sources retrieved */}
                                        {!message.isLoading && !message.error && message.sources && message.sources.length > 0 && (
                                            <div className="pt-2">
                                                <button
                                                    onClick={() =>
                                                        setExpandedSourceMsgId(
                                                            expandedSourceMsgId === message.id ? null : message.id
                                                        )
                                                    }
                                                    className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold cursor-pointer"
                                                >
                                                    <Info size={12} />
                                                    {message.sources.length} sources referenced
                                                    {expandedSourceMsgId === message.id ? (
                                                        <ChevronUp size={12} />
                                                    ) : (
                                                        <ChevronDown size={12} />
                                                    )}
                                                </button>

                                                {expandedSourceMsgId === message.id && (
                                                    <div className="mt-2 space-y-1.5 pl-1.5">
                                                        {message.sources.map((src, sIdx) => (
                                                            <div
                                                                key={sIdx}
                                                                className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 text-[11px] font-mono flex items-center justify-between"
                                                            >
                                                                <span className="truncate text-zinc-600 dark:text-zinc-300 max-w-[70%]">
                                                                    Source: {src.source}
                                                                </span>
                                                                <span className="bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[10px] text-zinc-500 font-semibold">
                                                                    Chunk #{src.chunkId}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input area */}
                <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0b0b0c]/50">
                    <form onSubmit={handleQuery} className="relative">
                        <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Ask questions about the ingested knowledge..."
                            className="w-full pl-4 pr-12 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder-zinc-400 dark:placeholder-zinc-500"
                            disabled={isAsking}
                        />
                        <Button
                            type="submit"
                            size="icon-sm"
                            disabled={isAsking || chatInput.trim().length < 3}
                            className="absolute right-2.5 top-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm shadow-indigo-600/10 disabled:opacity-30 cursor-pointer w-8 h-8 flex items-center justify-center"
                        >
                            {isAsking ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : (
                                <Send size={14} />
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}