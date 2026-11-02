/**
 * Server-side verification of Cloudflare Turnstile tokens.
 * https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */
const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

interface SiteverifyResponse {
  success: boolean;
  'error-codes'?: string[];
}

export async function verifyTurnstile(
  token: string,
  secret: string,
  remoteIp?: string,
): Promise<boolean> {
  if (!token) return false;

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set('remoteip', remoteIp);

  try {
    const response = await fetch(VERIFY_URL, { method: 'POST', body });
    const result = (await response.json()) as SiteverifyResponse;
    if (!result.success) {
      console.warn('[turnstile] verification failed', result['error-codes']);
    }
    return result.success;
  } catch (error) {
    console.error('[turnstile] siteverify request failed', error);
    return false;
  }
}
