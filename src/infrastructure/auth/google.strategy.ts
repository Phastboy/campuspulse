import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '@configs/validation';

export interface GoogleProfile {
  googleId: string;
  email: string;
  displayName: string;
}

/**
 * Passport strategy for Google OAuth 2.0 Authorization Code flow.
 * On callback, distils the Google profile down to only the fields
 * CampusPulse needs and places them on `request.user`.
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService<AppConfig>) {
    super({
      clientID: config.get('GOOGLE_CLIENT_ID') as string,
      clientSecret: config.get('GOOGLE_CLIENT_SECRET') as string,
      callbackURL: config.get('GOOGLE_CALLBACK_URL') as string,
      scope: ['profile', 'email'],
    });
  }

  validate(
    _at: string,
    _rt: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    done(null, {
      googleId: profile.id,
      email: profile.emails?.[0]?.value ?? '',
      displayName: profile.displayName,
    } satisfies GoogleProfile);
  }
}
