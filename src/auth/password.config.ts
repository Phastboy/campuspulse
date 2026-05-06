import { createPrismaAdapters } from "@odysseon/whoami-adapter-prisma";
import { PasswordModuleConfig } from "@odysseon/whoami-core/password";
import { PrismaService } from "../prisma/prisma.service.js";
import { Argon2PasswordHasher } from "@odysseon/whoami-adapter-argon2";
import { JoseReceiptConfig, JoseReceiptSigner } from "@odysseon/whoami-adapter-jose";
import { WebCryptoSecureTokenAdapter } from "@odysseon/whoami-adapter-webcrypto";
import { UuidGenerator, SystemClock, NestLoggerAdapter } from "./auth.adapters.js";

export const joseConfig: JoseReceiptConfig = {
  issuer: "pulse",
  audience: "password-users",
  secret: process.env.RECEIPT_SECRET || "",
};

const idGenerator = new UuidGenerator();
const clock = new SystemClock();
const prisma = new PrismaService();
const passwordHasher = new Argon2PasswordHasher();
const receiptSigner = new JoseReceiptSigner(joseConfig);
const secureToken = new WebCryptoSecureTokenAdapter();
const logger = new NestLoggerAdapter("PasswordModule");

const { accountRepo, passwordHashStore, resetTokenStore } = createPrismaAdapters(prisma);

export const passwordConfig: PasswordModuleConfig = {
  accountRepo,
  passwordHashStore,
  passwordHasher,
  idGenerator,
  clock,
  tokenLifespanMinutes: 600,
  resetTokenLifespanMinutes: 60,
  receiptSigner,
  resetTokenStore,
  secureToken,
  logger,
};
