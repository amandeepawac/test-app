import { ServiceUnavailableException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';
import type { Request } from 'express';

export function getTrustedClientIp(request: Request, secret?: string): string {
  const ip = request.get('x-auth-client-ip');
  const timestamp = request.get('x-auth-client-time');
  const signature = request.get('x-auth-client-signature');

  if (ip || timestamp || signature) {
    if (
      !secret ||
      Buffer.byteLength(secret, 'utf8') < 32 ||
      !ip ||
      !isIP(ip) ||
      !timestamp ||
      !/^\d{13}$/.test(timestamp) ||
      Math.abs(Date.now() - Number(timestamp)) > 30_000 ||
      !signature ||
      !/^[0-9a-f]{64}$/.test(signature)
    ) {
      throw new ServiceUnavailableException('Authentication is temporarily unavailable');
    }

    const expected = createHmac('sha256', secret).update(`${timestamp}:${ip}`).digest();
    if (!timingSafeEqual(expected, Buffer.from(signature, 'hex'))) {
      throw new ServiceUnavailableException('Authentication is temporarily unavailable');
    }
    return subnet(ip);
  }

  if (!request.ip || !isIP(request.ip)) {
    throw new ServiceUnavailableException('Authentication is temporarily unavailable');
  }
  return subnet(request.ip);
}

function subnet(ip: string): string {
  if (ip.toLowerCase().startsWith('::ffff:') && isIP(ip.slice(7)) === 4) return ip.slice(7);
  if (isIP(ip) === 4) return ip;
  const address = new URL(`http://[${ip}]/`).hostname.slice(1, -1);
  const [left = '', right = ''] = address.split('::');
  const prefix = left ? left.split(':') : [];
  const suffix = right ? right.split(':') : [];
  const groups = address.includes('::')
    ? [...prefix, ...Array<string>(8 - prefix.length - suffix.length).fill('0'), ...suffix]
    : prefix;
  return `${groups
    .slice(0, 4)
    .map((part) => part.padStart(4, '0'))
    .join(':')}::/64`;
}
