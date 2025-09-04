import { getCookie, setCookie } from 'hono/cookie';
import type { CustomContext } from './types';
import { D1Database } from '@cloudflare/workers-types';

export const SESSION_TOKEN_COOKIE_NAME = 'session_token';

export interface SessionData {
  userId: string;
  email: string;
  name: string;
  expiresAt: number;
}

// Simple in-memory session store for development
// In production, you should use a proper session store like Redis or D1 database
const sessionStore = new Map<string, SessionData>();

export const createSession = async (
  d1: D1Database,
  userData: { id: string; email: string; name: string }
): Promise<string> => {
  const sessionToken = crypto.randomUUID();
  const expiresAt = Date.now() + 60 * 24 * 60 * 60 * 1000; // 60 days

  await d1.prepare(
    'INSERT INTO sessions (token, user_id, email, user_name, expires_at) VALUES (?, ?, ?, ?, ?)'
  )
  .bind(sessionToken, userData.id, userData.email, userData.name, expiresAt)
  .run();

  return sessionToken;
};

export const getSession = async (d1: D1Database, sessionToken: string): Promise<SessionData | null> => {
  const result = await d1.prepare('SELECT user_id, email, user_name, expires_at FROM sessions WHERE token = ?')
    .bind(sessionToken)
    .first<{ user_id: string; email: string; user_name: string; expires_at: number }>();

  if (!result || result.expires_at < Date.now()) {
    if (result) {
      await d1.prepare('DELETE FROM sessions WHERE token = ?').bind(sessionToken).run();
    }
    return null;
  }

  return {
    userId: result.user_id,
    email: result.email,
    name: result.user_name,
    expiresAt: result.expires_at,
  };
};

export const deleteSession = async (d1: D1Database, sessionToken: string): Promise<void> => {
  await d1.prepare('DELETE FROM sessions WHERE token = ?').bind(sessionToken).run();
};


export const authMiddleware = async (c: CustomContext, next: () => Promise<void>) => {
  const sessionToken = getCookie(c, SESSION_TOKEN_COOKIE_NAME);
  
  if (!sessionToken) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const session = await getSession(c.env.DB, sessionToken);
  if (!session) {
    // Clear invalid session cookie
    setCookie(c, SESSION_TOKEN_COOKIE_NAME, '', {
      httpOnly: true,
      path: '/',
      sameSite: 'none',
      secure: true,
      maxAge: 0,
    });
    return c.json({ error: 'Invalid session' }, 401);
  }
  
  // Set user data in context
  c.set('user', {
    id: session.userId,
    email: session.email,
    name: session.name
  });
  
  await next();
};

// Mock OAuth functions for development
// In production, you would integrate with real OAuth providers
export const getOAuthRedirectUrl = async (_provider: string): Promise<string> => {
  // For development, redirect to a mock OAuth callback
  return `http://localhost:5173/auth/callback?code=mock_oauth_code_123`;
};

export const exchangeCodeForSessionToken = async (d1: D1Database, code: string): Promise<string> => {
  // Mock user data - in production, you would validate the OAuth code
  // and get real user data from the OAuth provider
  if (code === 'mock_oauth_code_123') {
    return createSession(d1, {
      id: 'mock_user_id_123',
      email: 'mock.user@example.com',
      name: 'Mock User'
    });
  }
  
  throw new Error('Invalid OAuth code');
};