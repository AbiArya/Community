"use client";

import Image from "next/image";
import { useProfileData } from "@/hooks/useProfileData";

export function ProfilePreview() {
  const { data: profile, isLoading, error } = useProfileData();

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

  const sortedPhotos = [...profile.photos].sort((a, b) => a.display_order - b.display_order);
  const primaryPhoto = sortedPhotos.find(p => p.is_primary) || sortedPhotos[0];
  const otherPhotos = sortedPhotos.filter(p => p.id !== primaryPhoto?.id);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">How Your Profile Appears to Others</h2>
        <p className="text-sm text-gray-600">This is how potential matches will see your profile</p>
      </div>

      {/* Profile Card - Similar to match cards */}
      <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
        {/* Primary Photo */}
        {primaryPhoto ? (
          <div className="aspect-[4/5] relative">
            <Image
              src={primaryPhoto.photo_url}
              alt={`${profile.full_name}'s profile`}
              fill
              className="object-cover"
              sizes="(max-width: 448px) 100vw, 448px"
              priority
            />
            {/* Photo indicators */}
            {sortedPhotos.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1">
                {sortedPhotos.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index === 0 ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-[4/5] bg-gray-100 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="w-16 h-16 mx-auto mb-2 bg-gray-200 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm">No photo</p>
            </div>
          </div>
        )}

        {/* Profile Info */}
        <div className="p-6 space-y-4">
          {/* Name and basic info */}
          <div className="text-center">
            <h3 className="text-xl font-semibold">{profile.full_name}</h3>
            {profile.age && (
              <p className="text-gray-600">{profile.age} years old</p>
            )}
            {profile.location && (
              <p className="text-sm text-gray-500">{profile.location}</p>
            )}
          </div>

          {/* Bio */}
          {profile.bio && (
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-1">About</h4>
              <p className="text-sm text-gray-600 leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {/* Hobbies */}
          {profile.hobbies.length > 0 && (
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-2">Interests</h4>
              <div className="flex flex-wrap gap-2">
                {profile.hobbies
                  .sort((a, b) => a.preference_rank - b.preference_rank)
                  .slice(0, 6) // Show top 6 hobbies
                  .map((userHobby) => (
                    <span
                      key={userHobby.id}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                    >
                      {userHobby.hobby?.name}
                    </span>
                  ))}
                {profile.hobbies.length > 6 && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                    +{profile.hobbies.length - 6} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Additional Photos Preview */}
          {otherPhotos.length > 0 && (
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-2">More Photos</h4>
              <div className="grid grid-cols-2 gap-2">
                {otherPhotos.slice(0, 2).map((photo) => (
                  <div key={photo.id} className="aspect-square relative">
                    <Image
                      src={photo.photo_url}
                      alt="Additional photo"
                      fill
                      className="object-cover rounded-lg"
                      sizes="(max-width: 448px) 50vw, 200px"
                    />
                  </div>
                ))}
                {otherPhotos.length > 2 && (
                  <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-xs text-gray-500">
                      +{otherPhotos.length - 2} more
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="max-w-md mx-auto p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Profile Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use high-quality, recent photos</li>
          <li>• Write a bio that shows your personality</li>
          <li>• Select hobbies that represent your interests</li>
          <li>• Keep your preferences realistic</li>
        </ul>
      </div>
    </div>
  );
}
