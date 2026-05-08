import { Module } from '@nestjs/common';
import { WhoamiModule } from '@odysseon/whoami-adapter-nestjs';
import { whoamiConfig } from './auth.config.js';
import { AccountsController } from './controllers/accounts.controller.js';
import { PasswordAuthController } from './controllers/password.controller.js';
import { IdentityController } from './controllers/identity.controller.js';
import { RegisterAccountUseCase } from './use-cases/register-account.service.js';

@Module({
  imports: [WhoamiModule.registerAsync(whoamiConfig)],
  controllers: [AccountsController, PasswordAuthController, IdentityController],
  providers: [RegisterAccountUseCase],
})
export class AuthModule {}
