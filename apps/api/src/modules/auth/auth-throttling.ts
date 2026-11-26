import { ServiceUnavailableException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { createHmac } from 'node:crypto';
import type { Request } from 'express';

const ACCOUNT_THROTTLED_PATHS = new Set(['/auth/login', '/auth/register', '/auth/forgot-password']);

export function shouldSkipAccountThrottle(context: ExecutionContext): boolean {
  const request = context.switchToHttp().getRequest<Request>();
  const path = request.path.replace(/\/+$/, '').toLowerCase();
  if (!ACCOUNT_THROTTLED_PATHS.has(path)) return true;

  const body: unknown = request.body;
  return (
    typeof body !== 'object' ||
    body === null ||
    !('email' in body) ||
    typeof body.email !== 'string' ||
    body.email.length > 254
  );
}

export function getAccountThrottleKey(request: Request, secret?: string): string {
  const body: unknown = request.body;
  if (
    typeof body !== 'object' ||
    body === null ||
    !('email' in body) ||
    typeof body.email !== 'string' ||
    body.email.length > 254 ||
    !secret ||
    Buffer.byteLength(secret, 'utf8') < 32
  ) {
    throw new ServiceUnavailableException('Authentication is temporarily unavailable');
  }

  const email = body.email.trim().normalize('NFC').toLowerCase();
  return createHmac('sha256', secret).update(email).digest('hex');
}
