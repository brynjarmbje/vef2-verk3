import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = '1234';
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const adminUser = await prisma.user.create({
    data: {
      name: 'admin',
      username: 'admin',
      password: hashedPassword, // Use the hashed password
      admin: true,
    },
  });

  console.log(`Created user with id: ${adminUser.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });