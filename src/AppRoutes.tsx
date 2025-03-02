import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { Characters } from './pages/Characters';
import { CharacterPage } from './pages/CharacterPage';
import { Compendium } from './pages/Compendium';
import { AdventureParty } from './pages/AdventureParty';
import { Notes } from './pages/Notes';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { DiceRollerModal } from './components/dice/DiceRollerModal';
import { PrivateRoute } from './components/auth/PrivateRoute';
import { SessionTimeoutWarning } from './components/session/SessionTimeoutWarning';
import { PartyView } from './pages/PartyView';
import { PartyJoinPage } from './pages/PartyJoinPage';

export function AppRoutes() {
  return (
    <div className="min-h-screen bg-gray-100">
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-white focus:text-blue-600"
      >
        Skip to main content
      </a>
      
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="*"
          element={
            <PrivateRoute>
              <>
                <Navigation />
                <main id="main-content" className="container mx-auto px-4 py-8">
                  <Routes>
                    <Route path="/" element={<Characters />} />
                    <Route path="/character/:id" element={<CharacterPage />} />
                    <Route path="/compendium" element={<Compendium />} />
                    <Route path="/adventure-party" element={<AdventureParty />} />
                    <Route path="/party/:id" element={<PartyView />} />
                    <Route path="/party/join/:id" element={<PartyJoinPage />} />
                    <Route path="/notes" element={<Notes />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
                <DiceRollerModal />
                <SessionTimeoutWarning />
              </>
            </PrivateRoute>
          }
        />
      </Routes>
    </div>
  );
}
