import React from 'react';
import Link from 'next/link';
import { Mail, CheckCircle2 } from 'lucide-react';
import Avatar from '../common/Avatar';
import Button from '../common/Button';

export default function ConnectionCard({ connection, currentUserId, className = '' }) {
  if (!connection) return null;

  // Determine peer user (if requester is current user, peer is recipient, else requester)
  const peer =
    connection.requester?._id?.toString() === currentUserId?.toString()
      ? connection.recipient
      : connection.requester || connection.recipient || {};

  const peerId = peer._id;

  return (
    <div
      className={`p-4 border border-gray-200 rounded-lg flex flex-col items-center text-center bg-white hover:shadow-sm transition-all duration-150 ${className}`}
    >
      <Link href={peerId ? `/profile/${peerId}` : '#'}>
        <Avatar
          src={peer.avatar}
          name={peer.name || 'Peer'}
          size="xl"
          className="mb-2.5 hover:opacity-90 transition-opacity cursor-pointer"
        />
      </Link>

      <Link
        href={peerId ? `/profile/${peerId}` : '#'}
        className="font-semibold text-gray-900 text-sm hover:text-brand-600 transition-colors truncate w-full"
      >
        {peer.name || 'Connected Peer'}
      </Link>

      <p className="text-xs text-gray-500 line-clamp-2 mt-1 mb-2.5 h-8 w-full">
        {peer.headline || 'Professional Peer'}
      </p>

      {/* Connection Status Indicator */}
      <div className="flex items-center space-x-1 text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium mb-3">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        <span>Connected</span>
      </div>

      <div className="mt-auto w-full">
        <Button
          variant="outline"
          size="sm"
          fullWidth
          icon={<Mail className="w-3.5 h-3.5 text-gray-500" />}
          onClick={() => {
            if (peer.email && typeof window !== 'undefined') {
              window.location.href = `mailto:${peer.email}`;
            }
          }}
        >
          Message
        </Button>
      </div>
    </div>
  );
}
