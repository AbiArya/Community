"use client";

import { useState } from "react";
import { useProfileData } from "@/hooks/useProfileData";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function AccountSettings() {
  const { data: profileData, refresh } = useProfileData();
  const [isEditing, setIsEditing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!profileData) {
    return <div className="text-sm text-gray-500">Loading account information...</div>;
  }

  const handlePhoneNumberUpdate = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const supabase = getSupabaseBrowserClient();
      
      // Phone number update would require adding phone field to database
      // For now, we'll show this as a placeholder
      setMessage({
        type: "error",
        text: "Phone number functionality is coming soon. The database schema needs to be updated first.",
      });
      
      setIsEditing(false);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to update phone number",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Email Display */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
        <div className="flex items-center gap-3">
          <input
            type="email"
            value={profileData.email}
            disabled
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
          />
          <span className="text-xs text-gray-500">Cannot be changed</span>
        </div>
      </div>

      {/* Phone Number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number <span className="text-xs text-gray-500">(Optional)</span>
        </label>
        {!isEditing ? (
          <div className="flex items-center gap-3">
            <div className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600">
              Not set
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-600 rounded-md hover:bg-blue-50"
            >
              Add Phone
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <button
                onClick={handlePhoneNumberUpdate}
                disabled={isLoading || !phoneNumber}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setPhoneNumber("");
                  setMessage(null);
                }}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        <p className="mt-1 text-xs text-gray-500">
          SMS verification will be required to add or change your phone number
        </p>
      </div>

      {/* Full Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
        <input
          type="text"
          value={profileData.full_name}
          disabled
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
        />
        <p className="mt-1 text-xs text-gray-500">
          To change your name, please edit your profile
        </p>
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
        <input
          type="text"
          value={profileData.location || "Not set"}
          disabled
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
        />
        <p className="mt-1 text-xs text-gray-500">
          To change your location, please edit your profile
        </p>
      </div>

      {/* Message Display */}
      {message && (
        <div
          className={`p-3 rounded-md text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}

