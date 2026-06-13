import { PrismaClient } from './generated/prisma/client.js';
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env["DATABASE_URL"] });
const prisma = new PrismaClient({ adapter });

async function run() {
  await prisma.user.updateMany({
    where: { account: { email: "owner@pulse.test" } },
    data: { role: "ADMIN" }
  });
  console.log("Done");
}
run();
