import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Home, Users, User, LogOut, Search, Compass, Menu, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logoutUser } from '../../store/slices/authSlice';
import Avatar from './Avatar';

export default function Navbar() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/network?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    router.push('/login');
  };

  const navLinks = [
    { href: '/', label: 'Feed', icon: Home },
    { href: '/network', label: 'My Network', icon: Users },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  const isActive = (path) => {
    if (path === '/') return router.pathname === '/';
    return router.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Left: Brand Logo & Search */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:bg-brand-700 transition-colors">
                CH
              </div>
              <span className="font-bold text-xl text-gray-900 tracking-tight hidden sm:inline">
                Connect<span className="text-brand-600">Hub</span>
              </span>
            </Link>

            {/* Global Search Bar */}
            <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search professionals, skills..."
                className="pl-9 pr-4 py-1.5 bg-gray-100 hover:bg-gray-50 focus:bg-white text-sm text-gray-800 rounded-md border border-transparent focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-500 w-64 transition-all"
              />
            </form>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 sm:space-x-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex flex-col items-center px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    active
                      ? 'text-brand-600 border-b-2 border-brand-600'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-0.5 ${active ? 'text-brand-600' : 'text-gray-500'}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right: Auth Profile / Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-3 pl-3 border-l border-gray-200">
                <Link
                  href="/profile"
                  className="flex items-center space-x-2 group hover:opacity-90"
                >
                  <Avatar
                    src={user.avatar}
                    name={user.name}
                    size="sm"
                    className="border"
                  />
                  <div className="text-left text-xs leading-tight hidden lg:block">
                    <p className="font-semibold text-gray-800 group-hover:text-brand-600">
                      {user.name}
                    </p>
                    <p className="text-gray-400 truncate max-w-[120px]">
                      {user.headline || 'Member'}
                    </p>
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  aria-label="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-50 rounded-md transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-3.5 py-1.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-md shadow-sm transition-colors"
                >
                  Join Now
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger menu button */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 pt-2 pb-4 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium ${
                  active
                    ? 'text-brand-600 bg-brand-50'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{link.label}</span>
              </Link>
            );
          })}

          <div className="pt-3 border-t border-gray-100">
            {isAuthenticated && user ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-3 px-3 py-1">
                  <Avatar src={user.avatar} name={user.name} size="sm" />
                  <div className="text-xs">
                    <p className="font-semibold text-gray-900">{user.name}</p>
                    <p className="text-gray-500">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 text-sm font-medium border border-brand-600 text-brand-600 rounded-md hover:bg-brand-50"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 text-sm font-medium bg-brand-600 text-white rounded-md hover:bg-brand-700"
                >
                  Join Now
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
