import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AdminRequest } from '@/modules/admin/admin-context.js';
import { PrismaService } from '@/infrastructure/database/prisma.service.js';
import { AuthService } from '@/modules/auth/services/auth.service.js';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authorization = request.headers.authorization;
    if (typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid session');
    }

    const token = authorization.slice(7);
    if (!token) throw new UnauthorizedException('Invalid session');

    const currentUser = await this.auth.currentUser(token);
    const user = await this.prisma.client.user.findUnique({
      where: { id: currentUser.id },
      select: { primaryRole: true },
    });
    if (user?.primaryRole !== 'ADMIN') throw new ForbiddenException('Admin access required');

    (request as AdminRequest).user = { id: currentUser.id };
    return true;
  }
}
