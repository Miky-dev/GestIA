"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { updateWhatsAppCredentials } from "@/actions/whatsapp-settings";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface WhatsAppFormProps {
    initialData: {
        waPhoneNumberId: string;
        waAccessToken: string;
        waVerifyToken: string;
    };
    webhookUrl: string;
}

export function WhatsAppSettingsForm({ initialData, webhookUrl }: WhatsAppFormProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const [waPhoneNumberId, setWaPhoneNumberId] = useState(initialData.waPhoneNumberId);
    const [waAccessToken, setWaAccessToken] = useState(initialData.waAccessToken);
    const [waVerifyToken, setWaVerifyToken] = useState(initialData.waVerifyToken);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await updateWhatsAppCredentials({
                waPhoneNumberId,
                waAccessToken,
                waVerifyToken,
            });

            toast({
                title: "✅ Credenziali salvate",
                description: "Le credenziali WhatsApp sono state aggiornate con successo.",
            });
        } catch (error) {
            toast({
                title: "Errore",
                description: error instanceof Error ? error.message : "Errore imprevisto.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyUrl = async () => {
        try {
            await navigator.clipboard.writeText(webhookUrl);
            setCopied(true);
            toast({ title: "URL copiato negli appunti!" });
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast({
                title: "Impossibile copiare",
                description: "Copia manualmente l'URL.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="space-y-6">
            {/* Card Principale — Form Credenziali */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <svg className="w-6 h-6 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        Configurazione WhatsApp Cloud API
                    </CardTitle>
                    <CardDescription>
                        Inserisci le credenziali dalla tua{" "}
                        <a
                            href="https://developers.facebook.com/apps/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                        >
                            Dashboard Sviluppatori Meta
                        </a>
                        . Servono a connettere il tuo numero WhatsApp Business a GestIA.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Phone Number ID */}
                        <div className="space-y-2">
                            <Label htmlFor="waPhoneNumberId">Phone Number ID</Label>
                            <Input
                                id="waPhoneNumberId"
                                placeholder="Es: 123456789012345"
                                value={waPhoneNumberId}
                                onChange={(e) => setWaPhoneNumberId(e.target.value)}
                                disabled={isLoading}
                            />
                            <p className="text-xs text-muted-foreground">
                                Lo trovi nella sezione &quot;WhatsApp &gt; API Setup&quot; della tua app Meta.
                            </p>
                        </div>

                        {/* Access Token */}
                        <div className="space-y-2">
                            <Label htmlFor="waAccessToken">Access Token (Permanente)</Label>
                            <Input
                                id="waAccessToken"
                                type="password"
                                placeholder={initialData.waAccessToken ? "••••••••  (reinserisci per modificare)" : "Incolla il tuo token permanente"}
                                value={waAccessToken}
                                onChange={(e) => setWaAccessToken(e.target.value)}
                                disabled={isLoading}
                            />
                            <p className="text-xs text-muted-foreground">
                                Usa un token permanente (System User Token) e non quello temporaneo che scade dopo 24h.
                            </p>
                        </div>

                        {/* Verify Token */}
                        <div className="space-y-2">
                            <Label htmlFor="waVerifyToken">Verify Token (Scegli una password segreta)</Label>
                            <Input
                                id="waVerifyToken"
                                placeholder="Es: la_mia_password_segreta_123"
                                value={waVerifyToken}
                                onChange={(e) => setWaVerifyToken(e.target.value)}
                                disabled={isLoading}
                            />
                            <p className="text-xs text-muted-foreground">
                                Scegli una stringa segreta a piacere. La userai anche sulla Dashboard Meta per verificare il webhook.
                            </p>
                        </div>

                        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Salvataggio...
                                </span>
                            ) : (
                                "💾 Salva Credenziali"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Card Webhook URL */}
            <Card className="border-dashed">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        🔗 URL Webhook da incollare sulla Dashboard di Meta
                    </CardTitle>
                    <CardDescription>
                        Vai su{" "}
                        <a
                            href="https://developers.facebook.com/apps/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                        >
                            Meta for Developers
                        </a>
                        {" → "}La tua App → WhatsApp → Configuration → Webhook → Edit.
                        Incolla l&apos;URL qui sotto nel campo &quot;Callback URL&quot; e il tuo Verify Token nel campo &quot;Verify Token&quot;.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 bg-muted rounded-md px-4 py-3 font-mono text-sm break-all select-all">
                            {webhookUrl}
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleCopyUrl}
                            className="shrink-0"
                        >
                            {copied ? "✓ Copiato" : "📋 Copia"}
                        </Button>
                    </div>

                    {/* Istruzioni visive */}
                    <div className="mt-4 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4">
                        <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">
                            📝 Come collegare il webhook in 3 passaggi:
                        </h4>
                        <ol className="text-sm text-blue-600 dark:text-blue-400 space-y-1 list-decimal list-inside">
                            <li>
                                Copia l&apos;URL qui sopra e incollalo nel campo <strong>&quot;Callback URL&quot;</strong> su Meta.
                            </li>
                            <li>
                                Nel campo <strong>&quot;Verify Token&quot;</strong> su Meta, incolla lo stesso Verify Token che hai scelto qui sopra.
                            </li>
                            <li>
                                Clicca <strong>&quot;Verify and Save&quot;</strong> su Meta. Se tutto è corretto vedrai un messaggio di conferma ✅
                            </li>
                        </ol>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
