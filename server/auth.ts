import type { Request, Response, NextFunction } from 'express';
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';

export interface AuthedRequest extends Request {
  userId: string;
}

const jwksByIssuer = new Map<string, JWTVerifyGetKey>();

/** Project origin from env. Placeholder values from .env.example do not count. */
export function supabaseProjectUrl(): string | null {
  const raw = (process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '').trim();
  if (!raw || raw.includes('your-project')) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

export function supabaseIssuer(projectUrl: string): string {
  return `${projectUrl}/auth/v1`;
}

function verificationKey(projectUrl: string): JWTVerifyGetKey {
  const issuer = supabaseIssuer(projectUrl);
  let key = jwksByIssuer.get(issuer);
  if (!key) {
    key = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));
    jwksByIssuer.set(issuer, key);
  }
  return key;
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const projectUrl = supabaseProjectUrl();
  if (!projectUrl) {
    res.status(503).json({
      error:
        'Authentication is not configured on the server (missing SUPABASE_URL).',
    });
    return;
  }

  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Sign in required.' });
    return;
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    res.status(401).json({ error: 'Sign in required.' });
    return;
  }

  try {
    const { payload } = await jwtVerify(token, verificationKey(projectUrl), {
      issuer: supabaseIssuer(projectUrl),
      audience: 'authenticated',
    });
    const userId = typeof payload.sub === 'string' ? payload.sub : '';
    if (!userId) {
      res.status(401).json({ error: 'Invalid session.' });
      return;
    }
    (req as AuthedRequest).userId = userId;
    next();
  } catch {
    res.status(401).json({ error: 'Session expired or invalid. Sign in again.' });
  }
}
