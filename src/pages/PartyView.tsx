import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Users, Book, Package, ArrowLeft, Plus, Link as LinkIcon, Copy, Check } from 'lucide-react';
import { Button } from '../components/shared/Button';
import { PartyNotes } from '../components/party/PartyNotes';
import { PartyInventory } from '../components/party/PartyInventory';
import { PartyMemberList } from '../components/party/PartyMemberList';
import { useAuth } from '../contexts/AuthContext';
import { Character } from '../types/character';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { ErrorMessage } from '../components/shared/ErrorMessage';

interface Party {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  members: Character[];
}

type ActiveTab = 'overview' | 'notes' | 'inventory';

export function PartyView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isDM } = useAuth();
  const [party, setParty] = useState<Party | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) {
      loadParty();
    }
  }, [id]);

  async function loadParty() {
    try {
      setLoading(true);
      const { data: partyData, error: partyError } = await supabase
        .from('parties')
        .select(`
          *,
          members:party_members(
            characters(*)
          )
        `)
        .eq('id', id)
        .single();

      if (partyError) throw partyError;
      if (!partyData) throw new Error('Party not found');

      // Transform the data structure
      const members = partyData.members
        .map((m: any) => m.characters)
        .filter(Boolean);

      setParty({
        ...partyData,
        members
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load party');
    } finally {
      setLoading(false);
    }
  }

  const generateInviteLink = () => {
    const baseUrl = window.location.origin;
    const inviteLink = `${baseUrl}/party/join/${id}`;
    setInviteLink(inviteLink);
  };

  const copyInviteLink = async () => {
    if (inviteLink) {
      try {
        await navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        setError('Failed to copy link to clipboard');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !party) {
    return (
      <div className="p-8">
        <ErrorMessage message={error || 'Party not found'} />
        <Button
          variant="secondary"
          icon={ArrowLeft}
          onClick={() => navigate('/adventure-party')}
          className="mt-4"
        >
          Back to Parties
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              icon={ArrowLeft}
              onClick={() => navigate('/adventure-party')}
            >
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{party.name}</h1>
              {party.description && (
                <p className="text-gray-600 mt-1">{party.description}</p>
              )}
            </div>
          </div>
          {isDM() && party.created_by === user?.id && (
            <div className="flex items-center gap-4">
              <Button
                variant="secondary"
                icon={inviteLink ? (copied ? Check : Copy) : LinkIcon}
                onClick={inviteLink ? copyInviteLink : generateInviteLink}
              >
                {inviteLink ? (copied ? 'Copied!' : 'Copy Link') : 'Generate Invite Link'}
              </Button>
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => navigate(`/party/${id}/add-member`)}
              >
                Add Member
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'overview'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Overview
          </div>
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'notes'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Book className="w-5 h-5" />
            Notes
          </div>
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'inventory'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Inventory
          </div>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <PartyMemberList 
          party={party}
          onUpdate={loadParty}
        />
      )}
      {activeTab === 'notes' && (
        <PartyNotes
          partyId={party.id}
          isDM={isDM()}
        />
      )}
      {activeTab === 'inventory' && (
        <PartyInventory
          partyId={party.id}
          members={party.members}
          isDM={isDM()}
        />
      )}
    </div>
  );
}
