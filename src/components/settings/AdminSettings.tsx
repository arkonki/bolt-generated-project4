import React, { useState } from 'react';
import { Users, Mail, Database, Activity, Sword } from 'lucide-react';
import { UserManagement } from '../admin/UserManagement';
import { SmtpSettings } from '../admin/SmtpSettings';
import { EmailMonitoring } from '../admin/EmailMonitoring';

type AdminTab = 'users' | 'email' | 'system';

export function AdminSettings() {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');

  const tabs = [
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'email', label: 'Email Settings', icon: Mail },
    { id: 'system', label: 'System', icon: Database }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagement />;
      case 'email':
        return (
          <div className="space-y-8">
            <SmtpSettings />
            <EmailMonitoring />
          </div>
        );
      case 'system':
        return (
          <div className="space-y-6">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h3 className="font-medium text-amber-800 mb-2">System Status</h3>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-500" />
                <span className="text-green-700">All systems operational</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Database Connection</h4>
                <p className="text-sm text-gray-600">Status: Connected</p>
                <p className="text-sm text-gray-600">Latency: 45ms</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Cache Status</h4>
                <p className="text-sm text-gray-600">Hit Rate: 94%</p>
                <p className="text-sm text-gray-600">Size: 24MB</p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Admin Panel</h2>

      {/* Tab Navigation */}
      <div className="border-b mb-6">
        <div className="flex gap-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`flex items-center gap-2 px-4 py-2 font-medium ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {renderContent()}
      </div>
    </div>
  );
}
