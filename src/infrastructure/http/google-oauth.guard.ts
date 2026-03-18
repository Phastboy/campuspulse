import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Triggers the Passport google strategy — initiates redirect or processes callback. */
@Injectable()
export class GoogleOAuthGuard extends AuthGuard('google') {}
