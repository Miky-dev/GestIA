"use client";

import { useState, useEffect } from "react";
import { ConversationList } from "@/components/inbox/ConversationList";
import { MessageThread } from "@/components/inbox/MessageThread";
import { CustomerSidebar } from "@/components/inbox/CustomerSidebar";
import { getConversations } from "@/actions/inbox";

// Per ora usiamo un tipo "any" o interfacce base, potremmo importare i tipi di Prisma
type ConversationPreview = { id: string; lastMessageAt: Date; channel: string; status: string; customerId: string; messages: unknown[]; customer: { firstName: string; lastName: string; phoneE164: string; email: string | null; vatNumber: string | null; }; };

export default function InboxPage() {
    const [conversations, setConversations] = useState<ConversationPreview[]>([]);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

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
    }, [selectedConversationId]);

    const activeConversation = conversations.find(c => c.id === selectedConversationId);

    return (
        <div className="flex h-[calc(100vh-theme(spacing.16))] w-full bg-white overflow-hidden rounded-xl border shadow-sm">
            {/* 1. Lista Conversazioni */}
            <div className="w-1/3 min-w-[300px] max-w-[400px] border-r flex flex-col">
                <ConversationList
                    conversations={conversations}
                    selectedId={selectedConversationId}
                    onSelect={setSelectedConversationId}
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
