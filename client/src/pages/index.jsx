import React, { useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchFeedPosts } from '../store/slices/postsSlice';
import { fetchSuggestions } from '../store/slices/connectionsSlice';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import Avatar from '../components/common/Avatar';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import CreatePostCard from '../components/feed/CreatePostCard';
import PostCard from '../components/feed/PostCard';
import SuggestionCard from '../components/network/SuggestionCard';

export default function FeedPage() {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { posts, loading: postsLoading, error: postsError } = useAppSelector((state) => state.posts);
  const { suggestions } = useAppSelector((state) => state.connections);

  useEffect(() => {
    dispatch(fetchFeedPosts());
    dispatch(fetchSuggestions());
  }, [dispatch]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Head>
        <title>Feed | ConnectHub Professional Network</title>
      </Head>

      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* Left Column: Mini Profile Summary */}
          <div className="hidden md:block md:col-span-1">
            <Card noPadding className="sticky top-20 shadow-sm">
              <div className="h-16 bg-gradient-to-r from-brand-700 via-brand-600 to-blue-500 rounded-t-lg" />
              <div className="px-4 pb-4 pt-0 -mt-8 flex flex-col items-center text-center">
                <Avatar
                  src={user?.avatar}
                  name={user?.name || 'Guest'}
                  size="lg"
                  className="ring-4 ring-white shadow-sm"
                />
                <h3 className="mt-2 font-bold text-gray-900 text-base">
                  {isAuthenticated && user ? user.name : 'Welcome to ConnectHub'}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                  {isAuthenticated && user
                    ? user.headline || 'Expand your professional reach'
                    : 'Sign in to access your feed and network'}
                </p>

                {isAuthenticated ? (
                  <div className="w-full mt-4 pt-4 border-t border-gray-100 text-left text-xs space-y-2">
                    <Link
                      href="/network"
                      className="flex justify-between items-center text-gray-600 hover:text-brand-600 py-1"
                    >
                      <span>Grow your network</span>
                      <span className="font-semibold text-brand-600">Connect</span>
                    </Link>
                    <Link
                      href="/profile"
                      className="flex justify-between items-center text-gray-600 hover:text-brand-600 py-1"
                    >
                      <span>View full profile</span>
                      <span className="font-semibold text-brand-600">Edit</span>
                    </Link>
                  </div>
                ) : (
                  <div className="w-full mt-4 pt-3 border-t border-gray-100 space-y-2">
                    <Link href="/login" className="block w-full">
                      <Button variant="primary" size="sm" fullWidth>
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/register" className="block w-full">
                      <Button variant="outline" size="sm" fullWidth>
                        Join Now
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Center Column: Create Post & Feed Stream */}
          <div className="col-span-1 md:col-span-2 lg:col-span-2 space-y-4">
            <CreatePostCard />

            {/* Posts Feed Stream */}
            {postsLoading && posts.length === 0 ? (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <Card key={n} className="animate-pulse">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 bg-gray-200 rounded w-1/3" />
                        <div className="h-2.5 bg-gray-200 rounded w-1/4" />
                      </div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-5/6" />
                  </Card>
                ))}
              </div>
            ) : postsError ? (
              <Card className="text-center py-8 border-red-200 bg-red-50/50">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-red-900">Unable to load feed</h4>
                <p className="text-xs text-red-600 mt-1 max-w-sm mx-auto">{postsError}</p>
                <div className="mt-4 flex justify-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white"
                    onClick={() => dispatch(fetchFeedPosts())}
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    Retry
                  </Button>
                </div>
              </Card>
            ) : posts.length === 0 ? (
              <Card className="text-center py-12">
                <p className="text-gray-500 text-sm">
                  No posts yet in the feed. Be the first to share an insight!
                </p>
              </Card>
            ) : (
              posts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))
            )}
          </div>

          {/* Right Column: Suggested Connections */}
          <div className="hidden lg:block lg:col-span-1 space-y-4">
            <Card className="shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm text-gray-900">
                  Add to your feed
                </h3>
                <Link
                  href="/network"
                  className="text-[11px] text-brand-600 font-semibold hover:underline"
                >
                  View all
                </Link>
              </div>

              {suggestions && suggestions.length > 0 ? (
                <div className="space-y-3">
                  {suggestions.slice(0, 3).map((item) => (
                    <SuggestionCard key={item._id} suggestion={item} />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500">
                  New connection recommendations will appear here.
                </p>
              )}
            </Card>

            <Card className="text-xs text-gray-500 space-y-2">
              <p className="font-semibold text-gray-700">ConnectHub Guidelines</p>
              <p>
                Keep conversations professional, respectful, and constructive. Report
                any abusive or spam content immediately.
              </p>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
