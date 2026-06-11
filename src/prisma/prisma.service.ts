import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';

export class PrismaService extends PrismaClient {
  constructor() {
    const connectionString = process.env['DATABASE_URL'];
    const adapter = new PrismaPg({
      connectionString,
    });
    super({ adapter });
  }
}
