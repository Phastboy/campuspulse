import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '@configs/validation';

export interface GoogleProfile {
  googleId: string;
  email: string;
  displayName: string;
}

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
    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(
        new UnauthorizedException(
          'Google account did not provide an email address. ' +
            'Ensure your Google account has a verified email and the email scope is granted.',
        ),
      );
      return;
    }

    done(null, {
      googleId: profile.id,
      email,
      displayName: profile.displayName,
    } satisfies GoogleProfile);
  }
}
