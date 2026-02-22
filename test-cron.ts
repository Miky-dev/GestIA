import { prisma } from "./src/lib/prisma";

async function main() {
    console.log("Creazione mockup per test Cron Job WA...");

    // Trova o crea una company
    let company = await prisma.company.findFirst();
    if (!company) {
        company = await prisma.company.create({
            data: {
                name: "Salone Beauty Test",
            }
        });
    }

    // Trova o crea un customer (finto)
    let customer = await prisma.customer.findFirst({
        where: { companyId: company.id }
    });
    if (!customer) {
        customer = await prisma.customer.create({
            data: {
                companyId: company.id,
                firstName: "Giulia",
                lastName: "Rossi",
                phoneE164: "+393331234567"
            }
        });
    }

    // Calcola orario di domani per il trigger
    const now = new Date();
    const startTime = new Date(now.getTime() + 25 * 60 * 60 * 1000); // Tra 25 ore
    const endTime = new Date(now.getTime() + 26 * 60 * 60 * 1000); // 1 ora di durata

    // Crea l'appuntamento
    const appointment = await prisma.appointment.create({
        data: {
            companyId: company.id,
            customerId: customer.id,
            startTime,
            endTime,
            status: "SCHEDULED",
            serviceType: "Mockup Manicure",
            reminderSent: false,
        }
    });

    console.log(`Appuntamento fittizio creato con ID: ${appointment.id}`);
    console.log(`Impostato a ${startTime.toISOString()} (tra 25h da adesso) e con reminderSent: false`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
