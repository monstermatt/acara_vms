'use client';

import { useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';

// Must be shorter than Django SIMPLE_JWT ACCESS_TOKEN_LIFETIME (5 min) so the access token
// is refreshed before it expires while the user is working.
const KEEPALIVE_MS = 4 * 60 * 1000;

// Should match session.maxAge in app/api/auth/[...nextauth]/route.ts
const IDLE_LIMIT_MS = 30 * 60 * 1000;

const ACTIVITY_EVENTS = ['keydown', 'mousedown', 'input', 'scroll', 'touchstart'] as const;

/**
 * Keeps the NextAuth session (and the Django access/refresh tokens) fresh while the user is
 * actively using the app, and signs them out after IDLE_LIMIT_MS of inactivity.
 *
 * Without this, the jwt callback only runs on a full page load or window focus, so users filling
 * out long forms end up with an expired access token and are logged out.
 *
 * Unlike SessionProvider's refetchInterval, idle tabs are NOT kept alive, so the idle timeout
 * is still enforced.
 */
export default function SessionKeepAlive() {
  const { data: session, status, update } = useSession();
  const lastActivity = useRef(Date.now());

  // update() changes identity whenever the session changes; keep the latest in a ref so the
  // interval below doesn't have to be torn down and recreated on every refresh.
  const updateRef = useRef(update);
  updateRef.current = update;

  useEffect(() => {
    if (status !== 'authenticated') return;

    lastActivity.current = Date.now();
    const markActive = () => {
      lastActivity.current = Date.now();
    };
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, markActive, { passive: true }));

    const intervalId = setInterval(() => {
      const idleFor = Date.now() - lastActivity.current;

      if (idleFor >= IDLE_LIMIT_MS) {
        signOut({ callbackUrl: '/login' });
      } else if (idleFor < KEEPALIVE_MS) {
        // User was active since the last tick: hit /api/auth/session, which runs the jwt callback
        // (refreshing the Django token if needed), re-issues the session cookie, and pushes the
        // new accessToken to every useSession() consumer.
        updateRef.current();
      }
      // Otherwise the user is idle but under the limit: do nothing and let the session age out.
    }, KEEPALIVE_MS);

    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, markActive));
      clearInterval(intervalId);
    };
  }, [status]);

  // The refresh token was rejected by Django (expired/invalid), so the session can't be recovered.
  useEffect(() => {
    if ((session as any)?.error === 'RefreshAccessTokenError') {
      signOut({ callbackUrl: '/login' });
    }
  }, [session]);

  return null;
}
