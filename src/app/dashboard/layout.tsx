import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    return (
        <DashboardShell
            userName={session.user?.name}
            isEmailVerified={session.user?.isEmailVerified ?? false}
        >
            {children}
        </DashboardShell>
    );
}

