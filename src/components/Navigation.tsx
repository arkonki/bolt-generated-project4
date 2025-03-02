import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDice } from './dice/DiceContext';
import { 
  Users, 
  Book, 
  Sword, 
  StickyNote, 
  Settings,
  LogOut,
  Shield,
  Crown,
  Dices
} from 'lucide-react';

export function Navigation() {
  const location = useLocation();
  const { signOut, isAdmin, isDM, role } = useAuth();
  const { toggleDiceRoller } = useDice();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', label: 'Characters', icon: Users, roles: ['player', 'dm', 'admin'] },
    { path: '/compendium', label: 'Compendium', icon: Book, roles: ['player', 'dm', 'admin'] },
    { path: '/adventure-party', label: 'Adventure Party', icon: Sword, roles: ['player', 'dm', 'admin'] },
    { path: '/notes', label: 'Notes', icon: StickyNote, roles: ['player', 'dm', 'admin'] },
    { path: '/settings', label: 'Settings', icon: Settings, roles: ['player', 'dm', 'admin'] },
  ];

  return (
    <nav className="bg-gray-800 text-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            {navItems
              .filter(item => item.roles.includes(role || 'player'))
              .map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                    isActive(path)
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </Link>
              ))}
          </div>
          <div className="flex items-center space-x-4">
            {/* Dice Roller Button */}
            <button
              onClick={toggleDiceRoller}
              className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <Dices className="w-5 h-5" />
              <span>Dice</span>
            </button>

            {/* Role indicator */}
            <div className="flex items-center space-x-2 px-3 py-2 rounded-md bg-gray-700">
              {isAdmin() ? (
                <>
                  <Crown className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm font-medium">Admin</span>
                </>
              ) : isDM() ? (
                <>
                  <Shield className="w-5 h-5 text-blue-400" />
                  <span className="text-sm font-medium">DM</span>
                </>
              ) : (
                <>
                  <Users className="w-5 h-5 text-green-400" />
                  <span className="text-sm font-medium">Player</span>
                </>
              )}
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <LogOut className="w-5 h-5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
