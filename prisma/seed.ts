import { PrismaClient, UserRoles } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as argon2 from 'argon2';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.PRISMA_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeder ishga tushdi...');

  const seedUsersStr = process.env.SEED_USERS;
  if (!seedUsersStr) {
    console.log('⚠️ SEED_USERS topilmadi. Hech kim qo\'shilmadi.');
    return;
  }

  // Format: ROLE=FirstName:LastName:Phone:Email:Password,ROLE2=...
  const usersToSeed = seedUsersStr.split(',').map((u) => u.trim());

  for (const userStr of usersToSeed) {
    const [role, data] = userStr.split('=');
    if (!role || !data) continue;

    const [first_name, last_name, phone, email, password] = data.split(':');
    
    if (!first_name || !last_name || !phone || !email || !password) {
      console.log(`⚠️ Noto'g'ri format: ${userStr}`);
      continue;
    }

    const hashedPassword = await argon2.hash(password);
    const attributes = role === 'SUPERADMIN' ? { permissions: { '*': ['*'] } } : { permissions: {} };

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ phone }, { email }]
      }
    });

    if (existingUser) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          phone,
          email,
          password: hashedPassword,
          first_name,
          last_name,
          role: role as UserRoles,
          status: 'active',
          attributes
        },
      });
    } else {
      await prisma.user.create({
        data: {
          phone,
          password: hashedPassword,
          email,
          first_name,
          last_name,
          address: 'System Seeded',
          role: role as UserRoles,
          status: 'active',
          attributes
        },
      });
    }

    console.log(`✅ Yaratildi/Yangilandi [${role}]: ${first_name} ${last_name} (${phone})`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeder xatosi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🏁 Seeder tugatildi.');
  });
