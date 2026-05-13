import { PrismaClient, PlatformRole } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { Argon2PasswordHasher } from "@odysseon/whoami-adapter-argon2";
import "dotenv/config";

// Create and configure the PrismaClient instance
const adapter = new PrismaPg({
  connectionString: process.env["DATABASE_URL"],
});

export const prisma = new PrismaClient({ adapter });
const hasher = new Argon2PasswordHasher();
const password = process.env["ADMIN_PASSWORD"];
const email = process.env["ADMIN_EMAIL"];

async function main() {
  if (!password || !email) {
    throw new Error("ADMIN_PASSWORD environment variable is not set");
  }
  const hashedPassword = await hasher.hash(password);

  console.log("🌱 Seeding Admin Account and User profile...");

  const account = await prisma.account.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash: {
        create: {
          hash: hashedPassword,
        },
      },
      user: {
        create: {
          name: "Steven Aanu",
          role: PlatformRole.ADMIN,
          avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Steven",
        },
      },
    },
    include: {
      user: true,
      passwordHash: true,
    },
  });

  console.log(`✅ Admin created with ID: ${account.id}`);
  console.log(`✅ User profile linked: ${account.user?.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
