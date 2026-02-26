"use client";

import { useState, useEffect } from "react";
import { ConversationList } from "@/components/inbox/ConversationList";
import { MessageThread } from "@/components/inbox/MessageThread";
import { CustomerSidebar } from "@/components/inbox/CustomerSidebar";
import { getConversations, markConversationAsRead } from "@/actions/inbox";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ConversationPreview = { id: string; lastMessageAt: Date; channel: string; status: string; customerId: string; messages: unknown[]; customer: { firstName: string; lastName: string; phoneE164: string; email: string | null; vatNumber: string | null; }; _count?: { messages: number }; };

export default function InboxPage() {
    const [conversations, setConversations] = useState<ConversationPreview[]>([]);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const handleSelect = async (id: string) => {
        setSelectedConversationId(id);
        // Segna i messaggi della conversazione come letti
        try {
            await markConversationAsRead(id);
            // Aggiorna il contatore nella lista conversazioni
            setConversations(prev =>
                prev.map(c =>
                    c.id === id
                        ? { ...c, _count: { ...c._count, messages: 0 } }
                        : c
                )
            );
        } catch (err) {
            console.error("Errore nel marcare come letto:", err);
        }
    };

    useEffect(() => {
        const loadConversations = async () => {
            try {
                const data = await getConversations();
                setConversations(data);
                if (data.length > 0 && !selectedConversationId) {
                    setSelectedConversationId(data[0].id);
                }
            } catch (err) {
                console.error("Errore nel caricamento conversazioni:", err);
            } finally {
                setIsLoading(false);
            }
        };
        loadConversations();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Polling: aggiorna la lista conversazioni ogni 5 secondi
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const data = await getConversations();
                setConversations(data);
            } catch (err) {
                console.error("Errore polling conversazioni:", err);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const activeConversation = conversations.find(c => c.id === selectedConversationId);

    return (
        <div className="flex h-[calc(100vh-theme(spacing.16))] w-full bg-white overflow-hidden rounded-xl border shadow-sm">
            {/* 1. Lista Conversazioni */}
            <div className="w-1/3 min-w-[300px] max-w-[400px] border-r flex flex-col">
                <ConversationList
                    conversations={conversations}
                    selectedId={selectedConversationId}
                    onSelect={handleSelect}
                    isLoading={isLoading}
                />
            </div>

            {/* 2. Thread Messaggi (Centrale) */}
            <div className="flex-1 flex flex-col bg-slate-50">
                {selectedConversationId ? (
                    <MessageThread conversationId={selectedConversationId} />
                ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        Seleziona una conversazione per iniziare
                    </div>
                )}
            </div>

            {/* 3. Sidebar Dettagli Cliente */}
            {activeConversation?.customer && (
                <div className="w-1/4 min-w-[250px] max-w-[350px] border-l bg-white hidden lg:block">
                    <CustomerSidebar customer={activeConversation.customer} />
                </div>
            )}
        </div>
    );
}
