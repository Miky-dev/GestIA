import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
    title: "GestIA",
    description: "Software gestionale AI-powered",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="it">
            <body>
                {children}
                <Toaster />
            </body>
        </html>
    );
}
