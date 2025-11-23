"use client";

import { useProfileData } from "@/hooks/useProfileData";
import { zipcodeToLocation } from "@/lib/utils/zipcode";

export function AccountSettings() {
  const { data: profileData } = useProfileData();

  if (!profileData) {
    return <div className="text-sm text-gray-500">Loading account information...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Email Display */}
      <div>
        <label className="block text-sm font-medium text-ink-700 mb-1">Email Address</label>
        <div className="flex items-center gap-3">
          <input
            type="email"
            value={profileData.email}
            disabled
            className="flex-1 input-base"
          />
          <span className="text-xs text-ink-500">Cannot be changed</span>
        </div>
      </div>

      {/* Full Name */}
      <div>
        <label className="block text-sm font-medium text-ink-700 mb-1">Full Name</label>
        <input
          type="text"
          value={profileData.full_name}
          disabled
          className="input-base"
        />
        <p className="mt-1 text-xs text-ink-500">
          To change your name, please edit your profile
        </p>
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-ink-700 mb-1">Location</label>
        <input
          type="text"
          value={
            profileData.zipcode
              ? zipcodeToLocation(profileData.zipcode) || profileData.zipcode
              : "Not set"
          }
          disabled
          className="input-base"
        />
        <p className="mt-1 text-xs text-ink-500">
          To change your location, please edit your profile
        </p>
      </div>
    </div>
  );
}
