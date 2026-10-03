export interface UserSession {
  email: string;
  startedAt: number;
}

const SESSION_KEY = 'creatorai.session';

export function getSession(): UserSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserSession;
  } catch {
    return null;
  }
}

export function hasSession(): boolean {
  return getSession() !== null;
}

export function createSession(email: string): UserSession {
  const session: UserSession = {
    email: email.trim(),
    startedAt: Date.now(),
  };
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    window.dispatchEvent(new Event('creatorai:session-changed'));
  }
  return session;
}

export function clearSession(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(SESSION_KEY);
    window.dispatchEvent(new Event('creatorai:session-changed'));
  }
}
