import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchMyProfile } from '../../store/slices/profileSlice';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import ProfileHeader from '../../components/profile/ProfileHeader';
import ProfileSummary from '../../components/profile/ProfileSummary';
import ExperienceTimeline from '../../components/profile/ExperienceTimeline';
import SkillsBadges from '../../components/profile/SkillsBadges';
import EditProfileModal from '../../components/profile/EditProfileModal';

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { myProfile, loading } = useAppSelector((state) => state.profile);

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchMyProfile());
    }
  }, [dispatch, isAuthenticated]);

  if (!isAuthenticated && !loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-100">
        <Navbar />
        <div className="flex-1 max-w-md mx-auto my-16 px-4">
          <Card className="text-center py-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Sign In to View Your Profile
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Create an account or sign in to build your professional profile, manage connections, and export your resume.
            </p>
            <div className="flex justify-center space-x-3">
              <Link href="/login">
                <Button variant="primary">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button variant="outline">Join Now</Button>
              </Link>
            </div>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const profile = myProfile || {};
  const profileUser = profile.user || user || {};

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Head>
        <title>
          {profileUser.name ? `${profileUser.name} | Profile` : 'My Profile | ConnectHub'}
        </title>
      </Head>

      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Profile Header */}
        <ProfileHeader
          profile={profile}
          isOwnProfile={true}
          onEditClick={() => setIsEditing(true)}
        />

        {/* Profile Summary / About */}
        <ProfileSummary
          summary={profile.summary}
          isOwnProfile={true}
          onEditClick={() => setIsEditing(true)}
        />

        {/* Work Experience History */}
        <ExperienceTimeline
          experience={profile.experience || []}
          isOwnProfile={true}
          onEditClick={() => setIsEditing(true)}
        />

        {/* Skills & Endorsements */}
        <SkillsBadges
          skills={profile.skills || []}
          isOwnProfile={true}
          onEditClick={() => setIsEditing(true)}
        />
      </main>

      {/* Edit Profile Modal Dialog */}
      <EditProfileModal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        profile={profile}
      />

      <Footer />
    </div>
  );
}
