"use client";

import { useProfileData } from "@/hooks/useProfileData";
import { useState } from "react";
import { ProfileEdit } from "./ProfileEdit";
import { ProfilePreview } from "./ProfilePreview";

export function ProfileView() {
  const { data: profile, isLoading, error, refresh } = useProfileData();
  const [isEditing, setIsEditing] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  // Debug log to see what profile data we're rendering
  console.log('ProfileView rendering with profile data:', profile);
  
  // Use updated_at as a key to force re-render when profile changes
  const profileKey = profile?.updated_at || 'no-profile';

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">Error loading profile: {error}</p>
          <button 
            onClick={refresh}
            className="mt-2 px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200"
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
        <p className="text-gray-600">No profile data found.</p>
      </div>
    );
  }

  // Show edit mode if editing
  if (isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Edit Profile</h1>
          <button
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
        </div>
        <ProfileEdit onSaveSuccess={() => {
          console.log('Save success callback triggered, exiting edit mode...');
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
          <h1 className="text-2xl font-semibold">Profile Preview</h1>
          <button
            onClick={() => setIsPreviewing(false)}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
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
          <h1 className="text-2xl font-semibold">{profile.full_name}</h1>
          <p className="text-gray-600">{profile.email}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsPreviewing(true)}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
          >
            Preview
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800"
          >
            Edit Profile
          </button>
        </div>
      </div>

      {/* Photos Section */}
      <div className="space-y-3">
        <h2 className="text-lg font-medium">Photos</h2>
        {profile.photos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {profile.photos.map((photo) => (
              <div key={photo.id} className="relative">
                <img
                  src={photo.photo_url}
                  alt={`Profile photo ${photo.display_order}`}
                  className="w-full h-48 object-cover rounded-lg"
                />
                {photo.is_primary && (
                  <span className="absolute top-2 left-2 px-2 py-1 text-xs bg-black text-white rounded">
                    Primary
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
            <p className="text-gray-500">No photos uploaded yet</p>
          </div>
        )}
      </div>

      {/* Bio Section */}
      <div className="space-y-3">
        <h2 className="text-lg font-medium">About Me</h2>
        {profile.bio ? (
          <p className="text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
        ) : (
          <p className="text-gray-500 italic">No bio written yet</p>
        )}
      </div>

      {/* Hobbies Section */}
      <div className="space-y-3">
        <h2 className="text-lg font-medium">Hobbies & Interests</h2>
        {profile.hobbies.length > 0 ? (
          <div className="space-y-2">
            {profile.hobbies.map((userHobby, index) => (
              <div key={userHobby.id} className="flex items-center gap-3">
                <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                  {userHobby.hobby.name}
                </span>
                <span className="text-xs text-gray-500">
                  {userHobby.hobby.category}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No hobbies selected yet</p>
        )}
      </div>

      {/* Preferences Section */}
      <div className="space-y-3">
        <h2 className="text-lg font-medium">Matching Preferences</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-sm text-gray-600">Age Range</h3>
            <p className="text-lg">{profile.age_range_min} - {profile.age_range_max}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-sm text-gray-600">Distance</h3>
            <p className="text-lg">{profile.distance_radius} km</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-sm text-gray-600">Match Frequency</h3>
            <p className="text-lg">{profile.match_frequency} per week</p>
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="space-y-3">
        <h2 className="text-lg font-medium">Profile Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-600">Member since:</span>
            <p>{new Date(profile.created_at).toLocaleDateString()}</p>
          </div>
          <div>
            <span className="font-medium text-gray-600">Last updated:</span>
            <p>{new Date(profile.updated_at).toLocaleDateString()}</p>
          </div>
          {profile.location && (
            <div>
              <span className="font-medium text-gray-600">Location:</span>
              <p>{profile.location}</p>
            </div>
          )}
          {profile.age && (
            <div>
              <span className="font-medium text-gray-600">Age:</span>
              <p>{profile.age}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
