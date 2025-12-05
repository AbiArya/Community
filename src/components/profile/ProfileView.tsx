"use client";

import Image from "next/image";
import { useProfileData } from "@/hooks/useProfileData";
import { useState } from "react";
import { ProfileEdit } from "./ProfileEdit";
import { ProfilePreview } from "./ProfilePreview";
import { SkeletonProfile } from "@/components/ui/Skeleton";

export function ProfileView() {
  const { data: profile, isLoading, error, refresh } = useProfileData();
  const [isEditing, setIsEditing] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  
  // Use updated_at as a key to force re-render when profile changes
  const profileKey = profile?.updated_at || 'no-profile';

  if (isLoading) {
    return <SkeletonProfile />;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="alert-error">
          <p className="font-medium">Error loading profile: {error}</p>
          <button 
            onClick={refresh}
            className="mt-2 rounded bg-error-100 px-3 py-1 text-sm text-error-800 hover:bg-error-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-4">
        <p className="text-ink-600">No profile data found.</p>
      </div>
    );
  }

  // Show edit mode if editing
  if (isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-ink-900">Edit Profile</h1>
          <button
            onClick={() => setIsEditing(false)}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
        <ProfileEdit onSaveSuccess={() => {
          // Force refresh the profile data before exiting edit mode
          refresh();
          setTimeout(() => {
            setIsEditing(false);
          }, 100);
        }} />
      </div>
    );
  }

  // Show preview mode if previewing
  if (isPreviewing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-ink-900">Profile Preview</h1>
          <button
            onClick={() => setIsPreviewing(false)}
            className="btn-secondary"
          >
            Back to Profile
          </button>
        </div>
        <ProfilePreview />
      </div>
    );
  }

  return (
    <div key={profileKey} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl text-ink-900">{profile.full_name}</h1>
          <p className="text-ink-600">{profile.email}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsPreviewing(true)}
            className="btn-secondary"
          >
            Preview
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className="rounded-lg bg-gradient-to-r from-brand-500 to-peach-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:from-brand-600 hover:to-peach-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            Edit Profile
          </button>
        </div>
      </div>

      {/* Photos Section */}
      <div className="space-y-3">
        <h2 className="text-lg font-medium text-ink-900">Photos</h2>
        {profile.photos.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {profile.photos.map((photo) => (
              <div key={photo.id} className="relative h-48">
                <Image
                  src={photo.photo_url}
                  alt={`Profile photo ${photo.display_order}`}
                  fill
                  className="rounded-2xl object-cover shadow-md"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                {photo.is_primary && (
                  <span className="absolute left-2 top-2 rounded-full bg-brand-600 px-2 py-1 text-xs text-white shadow-md z-10">
                    Primary
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-ink-200 p-8 text-center">
            <p className="text-ink-500">No photos uploaded yet</p>
          </div>
        )}
      </div>

      {/* Bio Section */}
      <div className="space-y-3">
        <h2 className="text-lg font-medium text-ink-900">About Me</h2>
        {profile.bio ? (
          <p className="whitespace-pre-wrap text-ink-700">{profile.bio}</p>
        ) : (
          <p className="italic text-ink-500">No bio written yet</p>
        )}
      </div>

      {/* Hobbies Section */}
      <div className="space-y-3">
        <h2 className="text-lg font-medium text-ink-900">Hobbies & Interests</h2>
        {profile.hobbies.length > 0 ? (
          <div className="space-y-2">
            {profile.hobbies.map((userHobby, index) => (
              <div key={userHobby.id} className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-sm font-medium text-brand-700">
                  {index + 1}
                </span>
                <span className="rounded-full bg-sand-100 px-3 py-1 text-sm text-ink-900">
                  {userHobby.hobby?.name}
                </span>
                <span className="text-xs text-ink-500">
                  {userHobby.hobby?.category}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="italic text-ink-500">No hobbies selected yet</p>
        )}
      </div>

      {/* Preferences Section */}
      <div className="space-y-3">
        <h2 className="text-lg font-medium text-ink-900">Matching Preferences</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="card-stat p-4">
            <h3 className="text-sm font-medium text-ink-600">Age Range</h3>
            <p className="text-lg text-ink-900">{profile.age_range_min} - {profile.age_range_max}</p>
          </div>
          <div className="card-stat p-4">
            <h3 className="text-sm font-medium text-ink-600">Distance</h3>
            <p className="text-lg text-ink-900">{profile.distance_radius} miles</p>
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="space-y-3">
        <h2 className="text-lg font-medium text-ink-900">Profile Information</h2>
        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
          <div>
            <span className="font-medium text-ink-600">Member since:</span>
            <p className="text-ink-900">{new Date(profile.created_at).toLocaleDateString()}</p>
          </div>
          <div>
            <span className="font-medium text-ink-600">Last updated:</span>
            <p className="text-ink-900">{new Date(profile.updated_at).toLocaleDateString()}</p>
          </div>
          {profile.zipcode && (
            <div>
              <span className="font-medium text-ink-600">Zipcode:</span>
              <p className="text-ink-900">{profile.zipcode}</p>
            </div>
          )}
          {profile.age && (
            <div>
              <span className="font-medium text-ink-600">Age:</span>
              <p className="text-ink-900">{profile.age}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
