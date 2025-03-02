import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppRoutes } from './AppRoutes';
import { AuthProvider } from './contexts/AuthContext';
import { DiceProvider } from './components/dice/DiceContext';
import { AppProvider } from './contexts/AppContext';
import { ErrorBoundary } from './components/errors/ErrorBoundary';
import { ErrorFallback } from './components/errors/ErrorFallback';
import { SessionTimeoutProvider } from './contexts/SessionTimeoutContext';

function App() {
  return (
    <ErrorBoundary fallback={<ErrorFallback error={new Error('Application failed to load')} />}>
      <AppProvider>
        <BrowserRouter>
          <AuthProvider>
            <SessionTimeoutProvider>
              <DiceProvider>
                <AppRoutes />
              </DiceProvider>
            </SessionTimeoutProvider>
          </AuthProvider>
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
