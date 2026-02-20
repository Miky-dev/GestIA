/**
 * Script di seed: crea una seconda company isolata e un admin2 di test
 * Esegui con: npx tsx scripts/seed-tenant2.ts
 */
import { prisma } from "../src/lib/prisma";
import { hash } from "bcryptjs";

async function main() {
    console.log("🌱 Avvio seed Tenant 2...");

    // 1. Crea la seconda company — completamente separata dalla prima
    const company = await prisma.company.upsert({
        where: { id: "company-test-002" },
        update: {},
        create: {
            id: "company-test-002",
            name: "Seconda Azienda Demo",
            subscriptionPlan: "STARTER",
            subscriptionStatus: "TRIAL",
        },
    });

    console.log(`✅ Company creata: ${company.name} (${company.id})`);

    // 2. Hash della password
    const passwordHash = await hash("password123", 12);

    // 3. Crea l'utente admin per il secondo tenant
    const user = await prisma.user.upsert({
        where: { email: "admin2@demo.com" },
        update: {},
        create: {
            companyId: company.id,
            name: "Admin 2 Demo",
            email: "admin2@demo.com",
            passwordHash,
            role: "ADMIN",
            isActive: true,
        },
    });

    console.log(`✅ Utente creato: ${user.email} (role: ${user.role})`);
    console.log("\n📋 Credenziali di accesso Tenant 2:");
    console.log("   Email:    admin2@demo.com");
    console.log("   Password: password123");
    console.log("\n🔒 Questo utente NON vede i dati di admin@demo.com (multi-tenant isolato)");
}

main()
    .catch((e) => {
        console.error("❌ Errore durante il seed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
