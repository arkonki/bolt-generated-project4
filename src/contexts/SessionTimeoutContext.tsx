import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

interface SessionTimeoutContextType {
  showWarning: boolean;
  extendSession: () => void;
}

const SessionTimeoutContext = createContext<SessionTimeoutContextType | undefined>(undefined);

const TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutes
const WARNING_DURATION = 30 * 1000; // 30 seconds
const ACTIVITY_CHECK_INTERVAL = 10 * 1000; // Check every 10 seconds

export function SessionTimeoutProvider({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [showWarning, setShowWarning] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout>();
  const [warningId, setWarningId] = useState<NodeJS.Timeout>();

  // Reset session timers
  const resetTimers = useCallback(() => {
    if (timeoutId) clearTimeout(timeoutId);
    if (warningId) clearTimeout(warningId);

    const newWarningId = setTimeout(() => {
      setShowWarning(true);
    }, TIMEOUT_DURATION - WARNING_DURATION);

    const newTimeoutId = setTimeout(async () => {
      await signOut();
      navigate('/login', { 
        state: { message: 'Your session has expired due to inactivity.' }
      });
    }, TIMEOUT_DURATION);

    setWarningId(newWarningId);
    setTimeoutId(newTimeoutId);
    setLastActivity(Date.now());
    setShowWarning(false);
  }, [signOut, navigate]);

  const extendSession = useCallback(() => {
    resetTimers();
  }, [resetTimers]);

  // Set up activity listeners
  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'mousemove', 'click', 'touchstart'];
    let activityCheckInterval: ReturnType<typeof setInterval>;
    
    // Debounce function to prevent excessive updates
    function debounce(func: Function, wait: number) {
      let timeout: NodeJS.Timeout;
      return function executedFunction(...args: any[]) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }

    // Handle user activity
    const handleActivity = debounce(() => {
      if (Date.now() - lastActivity > 1000) { // Throttle updates
        resetTimers();
      }
    }, 1000);

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Set up activity check interval
    activityCheckInterval = window.setInterval(() => {
      const inactiveTime = Date.now() - lastActivity;
      
      if (inactiveTime >= TIMEOUT_DURATION - WARNING_DURATION) {
        setShowWarning(true);
      }
      
      if (inactiveTime >= TIMEOUT_DURATION) {
        signOut();
        navigate('/login', { 
          state: { message: 'Your session has expired due to inactivity.' }
        });
      }
    }, ACTIVITY_CHECK_INTERVAL);

    // Set up initial timers
    resetTimers();

    // Cleanup function
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      if (timeoutId) clearTimeout(timeoutId);
      if (warningId) clearTimeout(warningId);
      window.clearInterval(activityCheckInterval);
    };
  }, [resetTimers, lastActivity]);

  return (
    <SessionTimeoutContext.Provider value={{ showWarning, extendSession }}>
      {children}
    </SessionTimeoutContext.Provider>
  );
}

export function useSessionTimeout() {
  const context = useContext(SessionTimeoutContext);
  if (context === undefined) {
    throw new Error('useSessionTimeout must be used within a SessionTimeoutProvider');
  }
  return context;
}
