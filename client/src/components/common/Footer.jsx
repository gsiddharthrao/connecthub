import React from 'react';
import Link from 'next/link';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-gray-200 bg-white py-6 text-xs text-gray-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-gray-700">ConnectHub</span>
          <span>&copy; {year} Professional Social Network</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <Link href="/" className="hover:text-brand-600 transition-colors">
            Feed
          </Link>
          <Link href="/network" className="hover:text-brand-600 transition-colors">
            My Network
          </Link>
          <Link href="/profile" className="hover:text-brand-600 transition-colors">
            Profile
          </Link>
          <span className="hover:text-brand-600 cursor-pointer">Privacy & Terms</span>
          <span className="hover:text-brand-600 cursor-pointer">Help Center</span>
        </div>
      </div>
    </footer>
  );
}
