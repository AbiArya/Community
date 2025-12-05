"use client";

import { useEffect, useState } from "react";
import { useProfileData } from "@/hooks/useProfileData";
import { zipcodeToLocation } from "@/lib/utils/zipcode-client";

export function AccountSettings() {
  const { data: profileData } = useProfileData();
  const [locationDisplay, setLocationDisplay] = useState<string>("");

  // Fetch location display when zipcode changes
  useEffect(() => {
    if (profileData?.zipcode) {
      zipcodeToLocation(profileData.zipcode).then(location => {
        setLocationDisplay(location || profileData.zipcode);
      });
    } else {
      setLocationDisplay("Not set");
    }
  }, [profileData?.zipcode]);

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
          value={locationDisplay}
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
