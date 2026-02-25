const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const apps = await prisma.appointment.findMany({
        take: 3
    });

    if (apps.length > 0) {
        const companyId = apps[0].companyId;
        const customerId = apps[0].customerId;

        await prisma.appointment.create({
            data: {
                companyId,
                customerId,
                startTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
                endTime: new Date(Date.now() - 23 * 60 * 60 * 1000),
                status: 'NO_SHOW',
                serviceType: 'Test Service NO SHOW',
                price: 150.00
            }
        });

        await prisma.appointment.create({
            data: {
                companyId,
                customerId,
                startTime: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
                endTime: new Date(Date.now() - 47 * 60 * 60 * 1000),
                status: 'CANCELLED',
                serviceType: 'Test Service CANCELLED',
                price: 75.50
            }
        });

        console.log("Created test appointments");
    }
}

check().catch(console.error).finally(() => prisma.$disconnect());
