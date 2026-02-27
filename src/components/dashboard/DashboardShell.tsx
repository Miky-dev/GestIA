"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { getUnreadCount } from "@/actions/inbox";
import {
    LayoutDashboard,
    Inbox,
    Users,
    CalendarDays,
    UserCog,
    LogOut,
    ChevronDown,
    Settings,
    CheckSquare,
    MessageCircle,
    CreditCard,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { EmailVerificationBanner } from "@/components/dashboard/EmailVerificationBanner";
import { format } from "date-fns";
import { it } from "date-fns/locale";

function HeaderDateTime() {
    const [mounted, setMounted] = useState(false);
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        setMounted(true);
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    if (!mounted) {
        return <div className="text-sm w-48 animate-pulse h-5 bg-zinc-100 rounded-md" />;
    }

    return (
        <div className="text-sm font-medium text-zinc-500 capitalize flex items-center gap-2">
            <span>{format(now, "EEEE d MMMM yyyy", { locale: it })}</span>
            <span>•</span>
            <span className="font-semibold">{format(now, "HH:mm")}</span>
        </div>
    );
}

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/inbox", label: "Inbox", icon: Inbox },
    { href: "/dashboard/customers", label: "Clienti", icon: Users },
    { href: "/dashboard/calendar", label: "Calendario", icon: CalendarDays },
    { href: "/dashboard/tasks", label: "Attività", icon: CheckSquare },
    { href: "/dashboard/employees", label: "Team", icon: UserCog },
];

interface DashboardShellProps {
    children: React.ReactNode;
    userName?: string | null;
    isEmailVerified?: boolean;
}

export function DashboardShell({ children, userName, isEmailVerified = true }: DashboardShellProps) {
    const pathname = usePathname();
    const [unreadCount, setUnreadCount] = useState(0);
    const initials = userName
        ? userName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : "U";

    // Polling contatore messaggi non letti ogni 5 secondi
    useEffect(() => {
        const fetchUnread = async () => {
            try {
                const count = await getUnreadCount();
                setUnreadCount(count);
            } catch { /* ignora errori */ }
        };
        fetchUnread();
        const interval = setInterval(fetchUnread, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex h-screen bg-zinc-50">
            {/* ── Sidebar ── */}
            <aside className="w-60 flex-shrink-0 border-r border-zinc-200 bg-white flex flex-col">
                {/* Logo */}
                <div className="h-14 flex items-center gap-2.5 px-5 border-b border-zinc-100">
                    <div className="w-7 h-7 rounded-lg bg-zinc-900 flex items-center justify-center">
                        <span className="text-white font-bold text-xs">G</span>
                    </div>
                    <span className="font-semibold text-zinc-900 text-sm tracking-tight">
                        GestIA
                    </span>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-3 space-y-0.5">
                    {navItems.map(({ href, label, icon: Icon }) => {
                        const isActive = pathname === href || pathname.startsWith(href + "/");
                        const isInbox = href === "/dashboard/inbox";
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-zinc-100 text-zinc-900"
                                        : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50"
                                )}
                            >
                                <Icon className={cn("w-4 h-4", isActive ? "text-zinc-900" : "text-zinc-400")} />
                                {label}
                                {isInbox && unreadCount > 0 && (
                                    <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold text-white bg-red-500 rounded-full">
                                        {unreadCount > 99 ? "99+" : unreadCount}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Settings Section (Staccata in basso) */}
                <div className="p-3 border-t border-zinc-100">
                    <p className="px-3 pb-1 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                        Impostazioni
                    </p>
                    <Link
                        href="/dashboard/settings/automations"
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                            pathname?.startsWith("/dashboard/settings/automations")
                                ? "bg-zinc-100 text-zinc-900"
                                : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50"
                        )}
                    >
                        <Settings className={cn("w-4 h-4", pathname?.startsWith("/dashboard/settings/automations") ? "text-zinc-900" : "text-zinc-400")} />
                        Automazioni
                    </Link>
                    <Link
                        href="/dashboard/settings/whatsapp"
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                            pathname?.startsWith("/dashboard/settings/whatsapp")
                                ? "bg-zinc-100 text-zinc-900"
                                : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50"
                        )}
                    >
                        <MessageCircle className={cn("w-4 h-4", pathname?.startsWith("/dashboard/settings/whatsapp") ? "text-zinc-900" : "text-zinc-400")} />
                        WhatsApp
                    </Link>
                    <Link
                        href="/dashboard/settings/billing"
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                            pathname?.startsWith("/dashboard/settings/billing")
                                ? "bg-zinc-100 text-zinc-900"
                                : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50"
                        )}
                    >
                        <CreditCard className={cn("w-4 h-4", pathname?.startsWith("/dashboard/settings/billing") ? "text-zinc-900" : "text-zinc-400")} />
                        Abbonamento
                    </Link>
                </div>

                {/* User footer */}
                <div className="p-3 border-t border-zinc-100">
                    <p className="px-3 pb-1 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                        Account
                    </p>
                    <DropdownMenu>
                        <DropdownMenuTrigger className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-zinc-50 transition-colors text-left">
                            <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs bg-zinc-200 text-zinc-700">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <span className="flex-1 text-sm font-medium text-zinc-700 truncate">
                                {userName ?? "Utente"}
                            </span>
                            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-red-500 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                                onClick={() => signOut({ callbackUrl: "/login" })}
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </aside>

            {/* ── Main area ── */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-14 flex items-center justify-between px-6 border-b border-zinc-200 bg-white">
                    <div className="flex-1 max-w-sm">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-50 border border-zinc-200 text-zinc-400 text-sm cursor-text">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            Cerca ovunque...
                            <kbd className="ml-auto text-xs text-zinc-300 font-mono">⌘K</kbd>
                        </div>
                    </div>

                    <div className="flex items-center gap-5">
                        <HeaderDateTime />
                        <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs bg-zinc-900 text-white font-medium">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                </header>

                {/* Email verification banner */}
                {!isEmailVerified && <EmailVerificationBanner />}

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
