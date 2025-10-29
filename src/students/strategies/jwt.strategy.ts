import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    super({
      // Try cookie first (HttpOnly cookie set at login), then fall back to Authorization header
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: any) => req?.cookies?.accessToken ?? null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  validate(payload: { id?: string; sub?: string; [key: string]: any }) {
    // If you sign the full user object into the token (safeUser), just return it.
    // Normalize the id property so downstream code can rely on `id`.
    const id = payload.id ?? payload.sub;
    return { id, ...payload };
  }
}
