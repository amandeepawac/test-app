import type { SessionResponse } from '@repo/contracts';
import { ACCESS_TTL_SECONDS } from './token.provider.js';

export function createSessionResponse(
  accessToken: string,
  refreshToken: string,
  refreshExpiresIn: number,
): SessionResponse {
  return { accessToken, refreshToken, accessExpiresIn: ACCESS_TTL_SECONDS, refreshExpiresIn };
}
