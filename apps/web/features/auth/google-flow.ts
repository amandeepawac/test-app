import 'server-only';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';

const publicRole = z.enum(['JOB_SEEKER', 'EMPLOYER']);
const randomValue = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
export const googleIntentSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('login') }),
  z.object({ mode: z.literal('signup'), role: publicRole }),
  z.object({ mode: z.literal('link'), userId: z.uuid(), workspace: z.enum(['employer', 'job-seeker']) }),
]);
export const googleFlowSchema = z.object({
  state: randomValue, nonce: randomValue, verifier: randomValue, intent: googleIntentSchema,
});
export type GoogleFlow = z.infer<typeof googleFlowSchema>;

export const googleFlowCookie = process.env.NODE_ENV === 'production'
  ? '__Host-google-flow' : 'google-flow';

export function googleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const webUrl = process.env.WEB_BASE_URL;
  const callback = process.env.GOOGLE_CALLBACK_URL;
  if (!clientId || !webUrl || !callback) throw new Error('Google authentication configuration is missing');
  const origin = new URL(webUrl);
  const redirect = new URL(callback);
  if (!['http:', 'https:'].includes(origin.protocol) || origin.username || origin.password ||
      redirect.username || redirect.password ||
      origin.origin !== redirect.origin || redirect.pathname !== '/auth/google/callback' ||
      redirect.search || redirect.hash ||
      (process.env.NODE_ENV === 'production' && origin.protocol !== 'https:')) {
    throw new Error('Google callback must use the web origin and /auth/google/callback');
  }
  return { clientId, origin: origin.origin, callback: redirect.href };
}

export function createGoogleFlow(intent: GoogleFlow['intent']): GoogleFlow {
  const random = () => randomBytes(32).toString('base64url');
  return { intent, state: random(), nonce: random(), verifier: random() };
}

export function googleAuthorizationUrl(flow: GoogleFlow, config: ReturnType<typeof googleConfig>) {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.search = new URLSearchParams({
    client_id: config.clientId, redirect_uri: config.callback, response_type: 'code',
    scope: 'openid email profile', state: flow.state, nonce: flow.nonce,
    code_challenge: createHash('sha256').update(flow.verifier).digest('base64url'),
    code_challenge_method: 'S256',
  }).toString();
  return url;
}

export function validGoogleState(expected: string, actual: string | null) {
  if (!actual || !randomValue.safeParse(actual).success) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
}
