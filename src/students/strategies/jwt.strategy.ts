import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    console.log('[jwt.strategy] strategy constructor running');
    // Custom extractor that logs the raw token found in cookies or headers for debugging.
    const debugExtractor = (req: any) => {
      try {
        const cookieToken = req?.cookies?.accessToken ?? null;
        if (cookieToken) {
          console.log(
            '[jwt.strategy] token extracted from cookie:',
            typeof cookieToken === 'string'
              ? cookieToken.slice(0, 40) + '...'
              : cookieToken,
          );
          return cookieToken;
        }
        // fallback to Authorization header
        const headerToken = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
        if (headerToken) {
          console.log(
            '[jwt.strategy] token extracted from Authorization header:',
            typeof headerToken === 'string'
              ? headerToken.slice(0, 40) + '...'
              : headerToken,
          );
        } else {
          console.log(
            '[jwt.strategy] no token found in cookie or Authorization header',
          );
        }
        return headerToken;
      } catch (err) {
        console.error('[jwt.strategy] extractor error:', err);
        return null;
      }
    };

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([debugExtractor]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  validate(payload: { id?: string; sub?: string; [key: string]: any }) {
    // If you sign the full user object into the token (safeUser), just return it.
    // Normalize the id property so downstream code can rely on `id`.
    const id = payload.id ?? payload.sub;
    console.log('[jwt.strategy] validated token payload:', {
      id,
      ...payload,
    });
    return { id, ...payload };
  }
}
