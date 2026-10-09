import React, { useState } from 'react';
import Link from 'next/link';
import { UserPlus, Check } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { sendConnectionRequest } from '../../store/slices/connectionsSlice';
import Avatar from '../common/Avatar';
import Button from '../common/Button';

export default function SuggestionCard({ suggestion, className = '' }) {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [requested, setRequested] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!suggestion) return null;

  const candidate = suggestion.user || suggestion || {};
  const candidateId = candidate._id;
  const headline = suggestion.headline || candidate.headline || 'ConnectHub Member';

  const handleConnect = async () => {
    if (!isAuthenticated || !candidateId || requested || loading) return;

    try {
      setLoading(true);
      await dispatch(sendConnectionRequest(candidateId)).unwrap();
      setRequested(true);
    } catch {
      // error handled in slice
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`p-4 border border-gray-200 rounded-lg flex flex-col items-center text-center bg-white hover:shadow-sm transition-all duration-150 ${className}`}
    >
      <Link href={candidateId ? `/profile/${candidateId}` : '#'}>
        <Avatar
          src={candidate.avatar}
          name={candidate.name || 'Candidate'}
          size="xl"
          className="mb-2.5 hover:opacity-90 transition-opacity cursor-pointer"
        />
      </Link>

      <Link
        href={candidateId ? `/profile/${candidateId}` : '#'}
        className="font-semibold text-gray-900 text-sm hover:text-brand-600 transition-colors truncate w-full"
      >
        {candidate.name || 'Professional'}
      </Link>

      <p className="text-xs text-gray-500 line-clamp-2 mt-1 mb-4 h-8 w-full">
        {headline}
      </p>

      <div className="mt-auto w-full">
        {requested ? (
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            disabled
            icon={<Check className="w-3.5 h-3.5 text-gray-500" />}
          >
            Pending
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            fullWidth
            onClick={handleConnect}
            isLoading={loading}
            disabled={!isAuthenticated}
            icon={<UserPlus className="w-3.5 h-3.5" />}
          >
            Connect
          </Button>
        )}
      </div>
    </div>
  );
}
