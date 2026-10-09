import React, { useState } from 'react';
import Link from 'next/link';
import { Check, X } from 'lucide-react';
import { useAppDispatch } from '../../store/hooks';
import {
  acceptConnectionRequest,
  rejectConnectionRequest,
} from '../../store/slices/connectionsSlice';
import Avatar from '../common/Avatar';
import Button from '../common/Button';

export default function PendingCard({ request, className = '' }) {
  const dispatch = useAppDispatch();
  const [loadingAction, setLoadingAction] = useState(null);

  if (!request) return null;

  const requester = request.requester || {};
  const requesterId = requester._id;

  const handleAccept = async () => {
    try {
      setLoadingAction('accept');
      await dispatch(acceptConnectionRequest(request._id)).unwrap();
    } catch {
      // error handled in slice
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReject = async () => {
    try {
      setLoadingAction('reject');
      await dispatch(rejectConnectionRequest(request._id)).unwrap();
    } catch {
      // error handled in slice
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div
      className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/80 transition-colors ${className}`}
    >
      <div className="flex items-center space-x-3.5">
        <Link href={requesterId ? `/profile/${requesterId}` : '#'}>
          <Avatar
            src={requester.avatar}
            name={requester.name || 'Member'}
            size="lg"
            className="hover:opacity-90 transition-opacity cursor-pointer"
          />
        </Link>
        <div>
          <Link
            href={requesterId ? `/profile/${requesterId}` : '#'}>
            <h4 className="font-semibold text-gray-900 text-sm hover:text-brand-600 transition-colors">
              {requester.name || 'ConnectHub Member'}
            </h4>
          </Link>
          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
            {requester.headline || 'Industry Professional'}
          </p>
          <span className="text-[11px] text-gray-400 mt-1 block">
            Wants to connect with you
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-2 self-end sm:self-center">
        <Button
          variant="ghost"
          size="sm"
          disabled={loadingAction !== null}
          onClick={handleReject}
          isLoading={loadingAction === 'reject'}
          icon={<X className="w-4 h-4 text-gray-500" />}
          className="hover:bg-red-50 hover:text-red-700"
        >
          Ignore
        </Button>
        <Button
          variant="primary"
          size="sm"
          disabled={loadingAction !== null}
          onClick={handleAccept}
          isLoading={loadingAction === 'accept'}
          icon={<Check className="w-4 h-4" />}
        >
          Accept
        </Button>
      </div>
    </div>
  );
}
