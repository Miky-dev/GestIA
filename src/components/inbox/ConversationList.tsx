"use client";

import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Phone } from "lucide-react";

interface ConversationListProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    conversations: any[]; // Useremo il tipo corretto dopo
    selectedId: string | null;
    onSelect: (id: string) => void;
    isLoading: boolean;
}

export function ConversationList({ conversations, selectedId, onSelect, isLoading }: ConversationListProps) {
    if (isLoading) {
        return <div className="p-4 text-center text-muted-foreground text-sm">Caricamento conversazioni...</div>;
    }

    if (conversations.length === 0) {
        return <div className="p-4 text-center text-muted-foreground text-sm border-t">Nessuna conversazione trovata.</div>;
    }

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="p-4 border-b">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <MessageSquare size={20} />
                    Inbox
                </h2>
                <input
                    type="text"
                    placeholder="Cerca conversazione..."
                    className="mt-4 w-full px-3 py-2 text-sm border rounded-md"
                />
            </div>

            <ScrollArea className="flex-1">
                {conversations.map((conv) => {
                    const isSelected = selectedId === conv.id;
                    const customerName = conv.customer?.firstName + " " + conv.customer?.lastName;
                    const initials = customerName.substring(0, 2).toUpperCase();
                    const lastMessageText = conv.messages?.[0]?.content || "Inizia chat";

                    return (
                        <button
                            key={conv.id}
                            onClick={() => onSelect(conv.id)}
                            className={`w-full text-left flex items-start p-4 hover:bg-slate-50 border-b transition-colors ${isSelected ? "bg-slate-100 border-l-4 border-l-primary" : "border-l-4 border-l-transparent"
                                }`}
                        >
                            <Avatar className="h-10 w-10 mr-3 mt-1">
                                <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 overflow-hidden">
                                <div className="flex justify-between items-baseline mb-1">
                                    <span className="font-semibold text-sm truncate">{customerName}</span>
                                    <span className="text-xs text-muted-foreground flex-shrink-0">
                                        {format(new Date(conv.lastMessageAt), "dd MMM, HH:mm", { locale: it })}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <p className="text-muted-foreground truncate max-w-[80%]">{lastMessageText}</p>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Phone size={12} />
                                    </div>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </ScrollArea>
        </div>
    );
}
