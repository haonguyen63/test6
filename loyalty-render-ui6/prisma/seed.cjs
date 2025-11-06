const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const base = [
    { username: 'admin',   password: 'admin',   role: 'admin',   name: 'Administrator', phone: '0900000000', autoLogoutMinutes: 10 },
    { username: 'manager', password: 'manager', role: 'manager', name: 'Manager User',  phone: '0900000001', autoLogoutMinutes: 10 },
    { username: 'staff',   password: 'staff',   role: 'staff',   name: 'Staff User',    phone: '0900000002', autoLogoutMinutes: null },
  ];
  for (const u of base) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: u
    });
  }
  console.log('Seeded default users.');
}

main().finally(()=>prisma.$disconnect());
