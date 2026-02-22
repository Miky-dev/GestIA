"use client";

import { useState, useTransition, useRef } from "react";
import { updateReminderTemplate } from "@/actions/templates";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Save } from "lucide-react";

export function TemplateFormClient({ initialContent }: { initialContent: string }) {
    const [content, setContent] = useState(initialContent);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    const variables = ["{{nome}}", "{{servizio}}", "{{data}}", "{{ora}}"];

    const handleSave = () => {
        startTransition(async () => {
            try {
                await updateReminderTemplate(content);
                toast({
                    title: "Salvato",
                    description: "Il template del promemoria è stato aggiornato con successo.",
                });
            } catch (error) {
                toast({
                    variant: "destructive",
                    title: "Errore",
                    description: error instanceof Error ? error.message : "Impossibile salvare il template.",
                });
            }
        });
    };

    const insertVariable = (variable: string) => {
        if (!textAreaRef.current) return;

        const textArea = textAreaRef.current;
        const start = textArea.selectionStart;
        const end = textArea.selectionEnd;

        // Inserisce il testo
        const updatedContent =
            content.substring(0, start) +
            variable +
            content.substring(end);

        setContent(updatedContent);

        // Ripristina il focus
        setTimeout(() => {
            textArea.focus();
            textArea.setSelectionRange(start + variable.length, start + variable.length);
        }, 0);
    };

    const mockPreviewText = content
        .replace(/\{\{nome\}\}/g, "Giulia")
        .replace(/\{\{servizio\}\}/g, "Manicure")
        .replace(/\{\{data\}\}/g, "15 Ottobre")
        .replace(/\{\{ora\}\}/g, "15:00");

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

            {/* 1. Colonna Editor Sinistra */}
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Messaggio Template WhatsApp
                    </label>
                    <textarea
                        ref={textAreaRef}
                        className="flex min-h-[160px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Inserisci qui il messaggio..."
                        disabled={isPending}
                    />
                </div>

                {/* Badge/Variabili supportate */}
                <div className="space-y-3">
                    <span className="text-sm text-slate-500">
                        Variabili consentite: premi per aggiungerle
                    </span>
                    <div className="flex flex-wrap gap-2">
                        {variables.map(v => (
                            <button
                                key={v}
                                onClick={() => insertVariable(v)}
                                type="button"
                                disabled={isPending}
                                className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80"
                            >
                                <PlusCircle className="w-3 h-3" /> {v}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={isPending}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                >
                    {isPending ? (
                        <>Salvando...</>
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-2" /> Salva Modifiche
                        </>
                    )}
                </button>
            </div>

            {/* 2. Colonna Anteprima Live WhatsApp */}
            <div className="bg-slate-100 rounded-2xl p-6 border flex flex-col items-center shadow-inner relative overflow-hidden min-h-[400px]">
                <div className="w-full absolute top-0 left-0 bg-[#075e54] h-14 flex items-center px-4 shadow-sm z-10">
                    <div className="w-8 h-8 rounded-full bg-slate-300 mr-3"></div>
                    <span className="text-white font-semibold">Salone Beauty</span>
                </div>

                {/* Background WhatsApp Pattern (fake) */}
                <div className="absolute inset-0 bg-[#e5ddd5] opacity-50 z-0 mt-14"></div>

                <div className="relative z-10 w-full flex justify-end mt-20">
                    {/* Chat Bubble Verde */}
                    <div className="bg-[#E7FFDB] text-[#111b21] px-3 py-2 rounded-lg max-w-[85%] shadow-sm relative text-sm whitespace-pre-wrap rounded-tr-none">
                        {mockPreviewText || "Il tuo messaggio apparirà qui..."}

                        {/* Codina alto-destra simile a WA desktop */}
                        <div className="absolute top-0 -right-2 w-0 h-0 border-t-[10px] border-t-[#E7FFDB] border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent shadow-sm"></div>

                        <div className="flex justify-end mt-1 text-[10px] text-gray-500">
                            15:42 <span className="ml-1 text-[#53bdeb]">✓✓</span>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-xs text-slate-400 font-medium z-10 bg-white/60 px-3 py-1 rounded-full text-center">
                    Anteprima dal vivo
                </div>
            </div>

        </div>
    );
}
