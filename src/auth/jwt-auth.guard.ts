import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: Error, user: any, info: any): any {
    if (err || !user) {
      const infoObj = info as Record<string, unknown> | undefined;
      const errorName =
        infoObj && typeof infoObj['name'] === 'string' ? infoObj['name'] : '';
      const errorMessage =
        infoObj && typeof infoObj['message'] === 'string'
          ? infoObj['message']
          : '';

      if (errorName === 'TokenExpiredError') {
        throw new UnauthorizedException('Token expirado');
      }
      if (errorName === 'JsonWebTokenError') {
        throw new UnauthorizedException('Token inválido');
      }
      if (errorMessage) {
        throw new UnauthorizedException(errorMessage);
      }
      throw err || new UnauthorizedException('Não autorizado');
    }
    return user;
  }
}
