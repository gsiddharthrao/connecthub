import React from 'react';
import { Users, Clock, Sparkles } from 'lucide-react';

export default function NetworkTabs({
  activeTab = 'connections',
  onTabChange,
  connectionsCount = 0,
  invitationsCount = 0,
  suggestionsCount = 0,
  className = '',
}) {
  const tabs = [
    {
      id: 'connections',
      label: 'My Connections',
      icon: Users,
      badge: connectionsCount,
      badgeClass: 'bg-gray-100 text-gray-700',
    },
    {
      id: 'invitations',
      label: 'Invitations',
      icon: Clock,
      badge: invitationsCount,
      badgeClass:
        invitationsCount > 0
          ? 'bg-brand-600 text-white font-bold'
          : 'bg-gray-100 text-gray-500',
    },
    {
      id: 'suggestions',
      label: 'Suggestions',
      icon: Sparkles,
      badge: suggestionsCount > 0 ? suggestionsCount : null,
      badgeClass: 'bg-blue-50 text-blue-700 font-semibold',
    },
  ];

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm p-1.5 flex flex-wrap gap-1 ${className}`}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange && onTabChange(tab.id)}
            className={`flex-1 min-w-[140px] flex items-center justify-center space-x-2 py-2 px-3 text-xs sm:text-sm font-medium rounded-md transition-all duration-150 ${
              isActive
                ? 'bg-brand-600 text-white shadow-xs font-semibold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
            <span>{tab.label}</span>
            {tab.badge !== null && tab.badge !== undefined && (
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full ml-1 ${
                  isActive ? 'bg-white/20 text-white' : tab.badgeClass
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
