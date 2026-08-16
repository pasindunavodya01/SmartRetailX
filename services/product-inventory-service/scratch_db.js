const prisma = require('./src/config/prisma');

async function main() {
    const active = await prisma.promotion.findFirst({ where: { active: true }, orderBy: { createdAt: 'desc' } });
    console.log("Active promotion in DB:", active);
}
main().catch(console.error).finally(() => prisma.$disconnect());
