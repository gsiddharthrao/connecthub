import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Users, Clock, Sparkles, Search } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchConnections,
  fetchPendingRequests,
  fetchSuggestions,
} from '../store/slices/connectionsSlice';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import Card from '../components/common/Card';
import NetworkTabs from '../components/network/NetworkTabs';
import ConnectionCard from '../components/network/ConnectionCard';
import PendingCard from '../components/network/PendingCard';
import SuggestionCard from '../components/network/SuggestionCard';
import api from '../services/api';

export default function NetworkPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const {
    connections,
    pendingRequests,
    suggestions,
    loading,
  } = useAppSelector((state) => state.connections);

  const [activeTab, setActiveTab] = useState('connections');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchConnections());
      dispatch(fetchPendingRequests());
    }
    dispatch(fetchSuggestions());
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    if (router.query.search) {
      setActiveTab('suggestions');
      setSearchLoading(true);
      api.get(`/profiles?search=${encodeURIComponent(router.query.search)}`)
        .then((res) => {
          setSearchResults(res.data.profiles || []);
        })
        .catch(() => setSearchResults([]))
        .finally(() => setSearchLoading(false));
    } else {
      setSearchResults(null);
    }
  }, [router.query.search]);

  const incomingRequests = pendingRequests?.incoming || [];
  const connectionsList = connections || [];
  const suggestionsList = suggestions || [];

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Head>
        <title>My Network | ConnectHub Professional Platform</title>
      </Head>

      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Navigation Tabs */}
        <NetworkTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          connectionsCount={connectionsList.length}
          invitationsCount={incomingRequests.length}
          suggestionsCount={suggestionsList.length}
        />

        {/* Tab 1: My Connections */}
        {activeTab === 'connections' && (
          <Card noPadding className="shadow-sm">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-900 text-base">
                  My Connections ({connectionsList.length})
                </h2>
                <p className="text-xs text-gray-500">
                  Your direct professional relationships and contacts
                </p>
              </div>
            </div>

            {connectionsList.length > 0 ? (
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {connectionsList.map((conn) => (
                  <ConnectionCard
                    key={conn._id}
                    connection={conn}
                    currentUserId={user?._id}
                  />
                ))}
              </div>
            ) : (
              <div className="p-10 text-center text-gray-500 text-sm">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-2.5" />
                <p className="font-medium text-gray-700">No active connections yet</p>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                  Browse through recommended professionals in the Suggestions tab to build your network.
                </p>
              </div>
            )}
          </Card>
        )}

        {/* Tab 2: Invitations */}
        {activeTab === 'invitations' && (
          <Card noPadding className="shadow-sm">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-900 text-base">
                  Invitations ({incomingRequests.length})
                </h2>
                <p className="text-xs text-gray-500">
                  Pending requests from colleagues wanting to connect
                </p>
              </div>
            </div>

            {incomingRequests.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {incomingRequests.map((req) => (
                  <PendingCard key={req._id} request={req} />
                ))}
              </div>
            ) : (
              <div className="p-10 text-center text-gray-500 text-sm">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-2.5" />
                <p className="font-medium text-gray-700">No pending invitations</p>
                <p className="text-xs text-gray-400 mt-1">
                  You are all caught up with your network requests.
                </p>
              </div>
            )}
          </Card>
        )}

        {/* Tab 3: Suggestions & Search */}
        {activeTab === 'suggestions' && (
          <Card noPadding className="shadow-sm">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-900 text-base flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-brand-600" />
                  <span>
                    {router.query.search
                      ? `Search Results for "${router.query.search}"`
                      : 'People You May Know'}
                  </span>
                </h2>
                <p className="text-xs text-gray-500">
                  {router.query.search
                    ? `Found ${(searchResults || []).length} professional profile(s)`
                    : 'Recommended peers based on industry, role, and skills'}
                </p>
              </div>
            </div>

            {searchLoading ? (
              <div className="p-10 text-center text-gray-500 text-sm">
                Searching professionals...
              </div>
            ) : (searchResults || suggestionsList).length > 0 ? (
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {(searchResults || suggestionsList).map((item) => (
                  <SuggestionCard key={item._id} suggestion={item} />
                ))}
              </div>
            ) : (
              <div className="p-10 text-center text-gray-500 text-xs">
                {router.query.search
                  ? `No professionals found matching "${router.query.search}". Try searching by another skill, title, or name.`
                  : 'No new suggestions at this time.'}
              </div>
            )}
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
}
