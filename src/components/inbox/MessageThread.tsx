"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Clock } from "lucide-react";
import { format } from "date-fns";
import { getConversationWithMessages, sendMessage } from "@/actions/inbox";

interface MessageThreadProps {
    conversationId: string;
}

export function MessageThread({ conversationId }: MessageThreadProps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [conversation, setConversation] = useState<any>(null);
    const [messageInput, setMessageInput] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Caricamento iniziale messaggi
    useEffect(() => {
        let mounted = true;
        const loadMessages = async () => {
            setIsLoading(true);
            try {
                const data = await getConversationWithMessages(conversationId);
                if (mounted) setConversation(data);
            } catch (err) {
                console.error("Errore nel caricamento dei messaggi:", err);
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        if (conversationId) {
            loadMessages();
        }

        return () => { mounted = false; };
    }, [conversationId]);

    // Scroll al fondo della chat ogni volta che i messaggi cambiano
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [conversation?.messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim() || isSending) return;

        setIsSending(true);
        try {
            const tempMessage = {
                id: "temp-" + Date.now(),
                content: messageInput,
                direction: "OUTBOUND",
                status: "SENDING",
                createdAt: new Date().toISOString()
            };

            // Aggiorna UI ottimisticamente
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setConversation((prev: any) => ({
                ...prev,
                messages: [...(prev?.messages || []), tempMessage]
            }));

            const inputReset = messageInput;
            setMessageInput("");

            const newMsg = await sendMessage({
                conversationId,
                content: inputReset
            });

            // Sostituisci il messaggio temporaneo con quello reale
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setConversation((prev: any) => ({
                ...prev,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                messages: prev.messages.map((m: any) => m.id === tempMessage.id ? newMsg : m)
            }));

        } catch (err) {
            console.error("Errore nell'invio del messaggio:", err);
            // Idealmente qui andrebbe mostrato un toast d'errore
        } finally {
            setIsSending(false);
        }
    };

    if (isLoading) {
        return <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">Caricamento conversazione...</div>;
    }

    if (!conversation) {
        return <div className="flex-1 flex items-center justify-center text-muted-foreground">Conversazione non trovata</div>;
    }

    const messages = conversation.messages || [];

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Thread Header */}
            <div className="p-4 bg-white border-b flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <h2 className="font-semibold">{conversation.customer?.firstName} {conversation.customer?.lastName}</h2>
                    <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full border">
                        {conversation.channel}
                    </span>
                </div>
                <div className="text-sm text-slate-500">
                    Stato: <span className="font-medium text-slate-700">{conversation.status}</span>
                </div>
            </div>

            {/* Area Messaggi */}
            <div
                className="flex-1 p-4 overflow-y-auto"
                ref={scrollRef}
            >
                <div className="space-y-4 max-w-3xl mx-auto flex flex-col">
                    {messages.length === 0 ? (
                        <div className="text-center text-muted-foreground my-10 py-10 border rounded-lg border-dashed">
                            Nessun messaggio in questa conversazione.<br />Inizia scrivendo qui sotto.
                        </div>
                    ) : (
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        messages.map((msg: any) => {
                            const isOutbound = msg.direction === "OUTBOUND";

                            return (
                                <div
                                    key={msg.id}
                                    className={`flex flex-col max-w-[75%] ${isOutbound ? "self-end items-end" : "self-start items-start"}`}
                                >
                                    <div
                                        className={`px-4 py-2 rounded-2xl ${isOutbound
                                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                                            : "bg-white border text-slate-800 rounded-tl-sm shadow-sm"
                                            }`}
                                    >
                                        <p className="text-[15px] whitespace-pre-wrap break-words">{msg.content}</p>
                                    </div>
                                    <div className="flex items-center gap-1 mt-1 px-1 text-[11px] text-slate-400">
                                        <Clock size={10} />
                                        <span>{format(new Date(msg.createdAt), "HH:mm")}</span>
                                        {isOutbound && (
                                            <span className="ml-1 opacity-70">
                                                {msg.status === "SENDING" ? "Inviando..." : "Inviato"}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t">
                <form
                    onSubmit={handleSendMessage}
                    className="flex gap-2 max-w-4xl mx-auto"
                >
                    <input
                        className="flex-1 px-4 py-3 rounded-xl border bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none"
                        placeholder={`Scrivi su ${conversation.channel}...`}
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        disabled={isSending || isLoading}
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={!messageInput.trim() || isSending || isLoading}
                        className="h-auto px-5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl flex items-center justify-center transition-colors disabled:opacity-50"
                    >
                        <Send size={18} className={messageInput.trim() ? "translate-x-0.5" : ""} />
                    </button>
                </form>
            </div>
        </div>
    );
}
