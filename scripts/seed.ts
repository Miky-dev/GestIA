/**
 * Script di seed: crea una company e un utente admin di test
 * Esegui con: npx tsx scripts/seed.ts
 */
import { prisma } from "../src/lib/prisma";
import { hash } from "bcryptjs";

async function main() {
    console.log("🌱 Avvio seed...");

    // 1. Crea la company di test
    const company = await prisma.company.upsert({
        where: { id: "company-test-001" },
        update: {},
        create: {
            id: "company-test-001",
            name: "Azienda Demo",
            subscriptionPlan: "STARTER",
            subscriptionStatus: "TRIAL",
        },
    });

    console.log(`✅ Company creata: ${company.name} (${company.id})`);

    // 2. Hash della password
    const passwordHash = await hash("password123", 12);

    // 3. Crea l'utente admin
    const user = await prisma.user.upsert({
        where: { email: "admin@demo.com" },
        update: {},
        create: {
            companyId: company.id,
            name: "Admin Demo",
            email: "admin@demo.com",
            passwordHash,
            role: "ADMIN",
            isActive: true,
        },
    });

    console.log(`✅ Utente creato: ${user.email} (role: ${user.role})`);
    console.log("\n📋 Credenziali di accesso:");
    console.log("   Email:    admin@demo.com");
    console.log("   Password: password123");
}

main()
    .catch((e) => {
        console.error("❌ Errore durante il seed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
