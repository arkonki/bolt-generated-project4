import { z } from 'zod';

// Simple user type
export interface SimpleUser {
  id: string;
  email: string;
  role: 'player' | 'dm' | 'admin';
  username: string;
}

// Mock users for development
const mockUsers: SimpleUser[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'arvi@maantoa.ee',
    role: 'admin',
    username: 'Admin'
  },
  {
    id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    email: 'dm@example.com',
    role: 'dm',
    username: 'DungeonMaster'
  },
  {
    id: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
    email: 'player@example.com',
    role: 'player',
    username: 'Player'
  }
];

// Validation schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export class SimpleAuth {
  private static readonly AUTH_KEY = 'dragonbane_auth';
  private static readonly RATE_LIMIT_KEY = 'dragonbane_rate_limit';
  private static readonly SESSION_KEY = 'dragonbane_auth_session';
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
  private static readonly SESSION_STATE_KEY = 'dragonbane_session_state';
  private static readonly SESSION_DURATION = 30 * 60 * 1000; // 30 minutes
  private static readonly SESSION_REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes
  private static readonly SESSION_CHECK_INTERVAL = 30 * 1000; // 30 seconds
  private static readonly SESSION_GRACE_PERIOD = 30 * 60 * 1000; // 30 minutes
  private static readonly SESSION_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes
  private static readonly SESSION_STORAGE_VERSION = '1.0';
  private static readonly SESSION_REFRESH_LOCK = new Set<string>();
  private static readonly SESSION_REFRESH_ATTEMPTS = 3;
  private static readonly SESSION_REFRESH_DELAY = 1000;
  private static readonly ACTIVITY_LOG_KEY = 'dragonbane_activity_log';

  private static logActivity() {
    const currentActivity = {
      lastActivity: Date.now(),
      sessionStart: Date.now(),
      sessionId: crypto.randomUUID()
    };

    localStorage.setItem(this.ACTIVITY_LOG_KEY, JSON.stringify({
      ...currentActivity
    }));

    localStorage.setItem(this.SESSION_STATE_KEY, JSON.stringify({
      sessionId: currentActivity.sessionId,
      version: this.SESSION_STORAGE_VERSION
    }));

    return currentActivity;
  }

  private static getLastActivity(): number {
    try {
      const log = localStorage.getItem(this.ACTIVITY_LOG_KEY);
      if (log) {
        return JSON.parse(log).lastActivity;
      }
    } catch (error) {
      console.error('Error reading activity log:', error);
    }
    return Date.now();
  }

  static getCurrentUser(): SimpleUser | null {
    try {
      const stored = localStorage.getItem(this.AUTH_KEY);
      const session = localStorage.getItem(this.SESSION_KEY);
      const sessionState = localStorage.getItem(this.SESSION_STATE_KEY);
      
      if (!stored || !session || !sessionState) {
        console.log('Missing auth data:', { stored: !!stored, session: !!session, sessionState: !!sessionState });
        this.signOut();
        return null;
      }

      // Parse session with error handling
      let sessionData, stateData;
      try {
        sessionData = JSON.parse(session);
        stateData = JSON.parse(sessionState);
      } catch (error) {
        console.error('Invalid session/state data:', error);
        this.signOut();
        return null;
      }

      // Validate session
      if (!this.isValidSession(sessionData, stateData)) {
        console.log('Invalid session detected');
        this.signOut();
        return null;
      }

      return JSON.parse(stored);
    } catch (error) {
      console.error('Error getting current user:', error);
      this.signOut();
      return null;
    }
  }

  private static isValidSession(session: any, state: any): boolean {
    try {
      const now = Date.now();
      
      if (!session?.expiresAt || !session?.lastRefresh || !state?.sessionId) {
        console.log('Invalid session structure');
        return false;
      }

      // Verify session state matches
      const currentState = localStorage.getItem(this.SESSION_STATE_KEY);
      if (!currentState || JSON.parse(currentState).sessionId !== state.sessionId) {
        console.log('Session ID mismatch');
        return false;
      }

      // Check if session is expired
      if (now > session.expiresAt + this.SESSION_GRACE_PERIOD) {
        console.log('Session expired');
        return false;
      }

      // Check if session needs refresh
      const timeUntilExpiry = session.expiresAt - now;
      if (timeUntilExpiry <= this.SESSION_REFRESH_THRESHOLD) {
        console.log('Session needs refresh');
        this.refreshSession().catch(error => {
          console.error('Failed to refresh session:', error);
          return false;
        });
      }

      return true;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  }

  private static async refreshSession(): Promise<void> {
    try {
      const session = JSON.parse(localStorage.getItem(this.SESSION_KEY) || '{}');
      const storedUser = localStorage.getItem(this.AUTH_KEY);
      this.logActivity();
      
      if (!storedUser) {
        throw new Error('No user data found');
      }
      
      const userId = JSON.parse(storedUser).id;

      // Prevent concurrent refreshes for the same user
      if (this.SESSION_REFRESH_LOCK.has(userId)) {
        console.log('Session refresh already in progress');
        return;
      }

      this.SESSION_REFRESH_LOCK.add(userId);

      const now = Date.now();
      // Only refresh if the session is still valid
      if (now > session.expiresAt + this.SESSION_GRACE_PERIOD) {
        throw new Error('Session expired');
      }

      // Add retry logic for session refresh
      let attempts = this.SESSION_REFRESH_ATTEMPTS;
      let lastError;

      while (attempts > 0) {
        try {
          // Extend session expiration
          session.expiresAt = now + this.SESSION_DURATION;
          session.lastRefresh = now;

          localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
          console.log('Session refreshed successfully');
          break;
        } catch (error) {
          lastError = error;
          attempts--;
          if (attempts > 0) {
            await new Promise(resolve => setTimeout(resolve, this.SESSION_REFRESH_DELAY));
          }
        }
      }

      if (attempts === 0 && lastError) {
        throw lastError;
      }
    } catch (error) {
      console.error('Failed to refresh session:', error);
      throw error;
    } finally {
      try {
        const storedUser = localStorage.getItem(this.AUTH_KEY);
        if (storedUser) {
          const userId = JSON.parse(storedUser).id;
          this.SESSION_REFRESH_LOCK.delete(userId);
        }
      } catch (error) {
        console.error('Error clearing session lock:', error);
      }
    }
  }

  static async verifySession(): Promise<boolean> {
    try {
      const session = localStorage.getItem(this.SESSION_KEY);
      const sessionState = localStorage.getItem(this.SESSION_STATE_KEY);
      const activityLog = JSON.parse(localStorage.getItem(this.ACTIVITY_LOG_KEY) || '{}');
      const lastActivity = activityLog.lastActivity || Date.now();
      
      // Check if session exists and is valid
      if (!session || !sessionState) {
        console.log('No session or session state found');
        return false;
      }

      // Verify session state version
      const state = JSON.parse(sessionState);
      if (state.version !== this.SESSION_STORAGE_VERSION) {
        console.log('Session version mismatch');
        return false;
      }

      const sessionData = JSON.parse(session);
      const now = Date.now();

      // Check if session has expired due to inactivity
      const inactivityDuration = now - lastActivity;
      if (inactivityDuration > this.SESSION_DURATION) {
        console.log('Session expired due to inactivity');
        console.log('Inactivity duration:', inactivityDuration);
        await this.signOut();
        return false;
      }

      // Check session integrity
      if (sessionData.sessionId !== state.sessionId) {
        console.log('Session ID mismatch');
        await this.signOut();
        return false;
      }
      // Check absolute expiration
      if (now > sessionData.expiresAt + this.SESSION_GRACE_PERIOD) {
        console.log('Session expired');
        await this.signOut();
        return false;
      }

      // Update last activity
      this.logActivity();
      return true;
    } catch (error) {
      console.error('Session verification error:', error);
      this.signOut();
      return false;
    }
  }

  static async signIn(email: string, password: string): Promise<SimpleUser> {
    try {
      const activity = this.logActivity();
      // Validate input
      loginSchema.parse({ email, password });

      // Check rate limiting
      if (this.isRateLimited()) {
        throw new Error('Too many login attempts. Please try again later.');
      }

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Find user
      const user = mockUsers.find(u => u.email === email);
      
      if (!user || password !== 'Admin1234') {
        this.recordFailedAttempt();
        throw new Error('Invalid login credentials');
      }

      // Store user in localStorage
      localStorage.setItem(this.AUTH_KEY, JSON.stringify(user));
      localStorage.setItem(this.SESSION_KEY, JSON.stringify({
        expiresAt: Date.now() + this.SESSION_DURATION,
        lastRefresh: Date.now(),
        sessionId: activity.sessionId
      }));
      this.clearRateLimit();

      return user;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error('Invalid email or password format');
      }
      throw error;
    }
  }

  static async signOut(): Promise<void> {
    localStorage.removeItem(this.AUTH_KEY);
    localStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem(this.SESSION_STATE_KEY);
    localStorage.removeItem(this.ACTIVITY_LOG_KEY);
  }

  private static isRateLimited(): boolean {
    const stored = localStorage.getItem(this.RATE_LIMIT_KEY);
    if (!stored) return false;

    const { attempts, timestamp } = JSON.parse(stored);
    const now = Date.now();

    if (now - timestamp > this.RATE_LIMIT_WINDOW) {
      this.clearRateLimit();
      return false;
    }

    return attempts >= this.MAX_ATTEMPTS;
  }

  private static recordFailedAttempt(): void {
    const stored = localStorage.getItem(this.RATE_LIMIT_KEY);
    const now = Date.now();

    if (!stored) {
      localStorage.setItem(this.RATE_LIMIT_KEY, JSON.stringify({
        attempts: 1,
        timestamp: now
      }));
      return;
    }

    const { attempts, timestamp } = JSON.parse(stored);
    if (now - timestamp > this.RATE_LIMIT_WINDOW) {
      localStorage.setItem(this.RATE_LIMIT_KEY, JSON.stringify({
        attempts: 1,
        timestamp: now
      }));
    } else {
      localStorage.setItem(this.RATE_LIMIT_KEY, JSON.stringify({
        attempts: attempts + 1,
        timestamp
      }));
    }
  }

  private static clearRateLimit(): void {
    localStorage.removeItem(this.RATE_LIMIT_KEY);
  }
}
