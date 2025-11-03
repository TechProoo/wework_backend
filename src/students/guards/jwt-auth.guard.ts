import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from 'src/decorators/public.decorator';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
  ) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    try {
      const req = context.switchToHttp().getRequest();
      console.log('[jwt.guard] canActivate - isPublic=', isPublic, 'method=', req.method, 'url=', req.url);
    } catch (e) {
      // ignore
    }
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  // Override handleRequest to surface passport errors/info for debugging
  // This will run after passport strategy executes. We log error/info and
  // attempt a fallback verification if Passport didn't attach a user.
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    try {
      console.log('[jwt.guard] handleRequest called', {
        err: err ? err.message || err : null,
        hasUser: !!user,
        info: info ? info.message || info : null,
      });
    } catch (logErr) {
      // swallow logging errors
      console.error('[jwt.guard] logging failed', logErr);
    }

    if (err) {
      throw err;
    }

    if (!user) {
      // Log cookie/header previews to aid debugging
      try {
        const req = context.switchToHttp().getRequest();
        const rawCookieHeader = req?.headers?.cookie ?? null;
        const parsedAccess = req?.cookies?.accessToken ?? null;
        const preview = parsedAccess
          ? typeof parsedAccess === 'string'
            ? parsedAccess.slice(0, 40) + '...'
            : String(parsedAccess)
          : null;
        console.log(
          '[jwt.guard] request cookie header preview:',
          rawCookieHeader ? rawCookieHeader.slice(0, 120) + '...' : null,
        );
        console.log(
          '[jwt.guard] parsed req.cookies.accessToken preview:',
          preview,
        );
      } catch (reqLogErr) {
        console.error('[jwt.guard] request cookie logging failed', reqLogErr);
      }

      // Attempt fallback verification using JwtService
      try {
        const req = context.switchToHttp().getRequest();
        const token = req?.cookies?.accessToken ?? null;
        if (token && typeof token === 'string') {
          try {
            const payload = this.jwtService.verify(token, {
              secret: process.env.JWT_SECRET,
            });
            console.log('[jwt.guard] fallback verified token payload:', {
              id: payload['id'] ?? payload['sub'],
            });
            const id = payload['id'] ?? payload['sub'];
            return { id, ...payload };
          } catch (verifyErr) {
            console.log(
              '[jwt.guard] fallback token verify failed',
              verifyErr?.message || verifyErr,
            );
          }
        }
      } catch (fallbackErr) {
        console.error(
          '[jwt.guard] token fallback verification error',
          fallbackErr,
        );
      }

      throw new UnauthorizedException(info?.message || 'Unauthorized');
    }

    return user;
  }
}
