import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { User, Key, Copy, Check, AlertCircle, X } from 'lucide-react';
import { Button } from '../shared/Button';

interface UserCreationModalProps {
  onClose: () => void;
  onUserCreated: () => void;
}

export function UserCreationModal({ onClose, onUserCreated }: UserCreationModalProps) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'player' | 'dm'>('player');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signInLink, setSignInLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Generate a random password
      const tempPassword = Math.random().toString(36).slice(-12);

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: tempPassword,
        options: {
          data: {
            username
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Update user role in public.users table
      const { error: updateError } = await supabase
        .from('users')
        .update({ role })
        .eq('id', authData.user.id);

      if (updateError) throw updateError;

      // Generate sign-in link
      const signInUrl = new URL(window.location.origin);
      signInUrl.searchParams.set('email', email);
      signInUrl.searchParams.set('password', tempPassword);
      setSignInLink(signInUrl.toString());

      setSuccess(true);
      onUserCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (signInLink) {
      try {
        await navigator.clipboard.writeText(signInLink);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      } catch (err) {
        setError('Failed to copy link to clipboard');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Create New User</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && signInLink ? (
            <div className="space-y-6">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-medium text-green-800 mb-2">User Created Successfully!</h3>
                <p className="text-sm text-green-700">
                  Share the following link with the user to let them sign in:
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={signInLink}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
                <Button
                  variant="secondary"
                  icon={linkCopied ? Check : Copy}
                  onClick={copyToClipboard}
                >
                  {linkCopied ? 'Copied!' : 'Copy'}
                </Button>
              </div>

              <div className="flex justify-end">
                <Button variant="primary" onClick={onClose}>
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'player' | 'dm')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="player">Player</option>
                  <option value="dm">Dungeon Master</option>
                </select>
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  variant="secondary"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  icon={User}
                  loading={loading}
                >
                  Create User
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
