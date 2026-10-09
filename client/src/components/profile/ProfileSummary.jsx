import React from 'react';
import { Edit3 } from 'lucide-react';
import Card from '../common/Card';

export default function ProfileSummary({
  summary,
  isOwnProfile = false,
  onEditClick,
  className = '',
}) {
  return (
    <Card className={`shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gray-900">About</h2>
        {isOwnProfile && (
          <button
            type="button"
            onClick={onEditClick}
            className="p-1 text-gray-400 hover:text-brand-600 transition-colors rounded"
            title="Edit summary"
            aria-label="Edit summary"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        )}
      </div>

      {summary && summary.trim() ? (
        <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
          {summary}
        </p>
      ) : (
        <p className="text-sm text-gray-400 italic">
          {isOwnProfile
            ? 'Add a summary to tell the community about your professional background, goals, and expertise.'
            : 'No summary provided.'}
        </p>
      )}
    </Card>
  );
}
