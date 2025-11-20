"use client";

import { useEffect, useMemo, useState } from "react";
import { useProfileData } from "@/hooks/useProfileData";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function AccountSettings() {
  const { data: profileData, refresh } = useProfileData();
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!profileData) {
      setPhoneInput("");
      return;
    }

    if (!isEditingPhone) {
      setPhoneInput(profileData.phone_number ?? "");
    }
  }, [profileData, isEditingPhone]);

  if (!profileData) {
    return <div className="text-sm text-gray-500">Loading account information...</div>;
  }

  const stripFormatting = (value: string) =>
    value.trim() === "" ? "" : value.replace(/[\s().-]/g, "");

  const normalizedInput = stripFormatting(phoneInput);
  const hasPhoneChanged = normalizedInput !== (profileData.phone_number ?? "");
  const isRemovingPhone = Boolean(profileData.phone_number) && normalizedInput === "";

  const formattedPhoneNumber = useMemo(() => {
    return profileData.phone_number ? profileData.phone_number : "Not set";
  }, [profileData.phone_number]);

  const startEditing = () => {
    setIsEditingPhone(true);
    setPhoneInput(profileData.phone_number ?? "");
    setMessage(null);
  };

  const cancelEditing = () => {
    setIsEditingPhone(false);
    setPhoneInput(profileData.phone_number ?? "");
    setMessage(null);
  };

  const handlePhoneNumberUpdate = async () => {
    if (!hasPhoneChanged) {
      setMessage({
        type: "error",
        text: "Enter a new phone number or clear it to remove.",
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const normalized = normalizedInput;

      if (normalized && !normalized.startsWith("+")) {
        throw new Error("Include your country code. Example: +15551234567");
      }

      if (normalized && !/^\+[1-9]\d{7,14}$/.test(normalized)) {
        throw new Error("Enter a valid phone number (8-15 digits after the + sign).");
      }

      const supabase = getSupabaseBrowserClient();

      const { error } = await supabase
        .from("users")
        .update({
          phone_number: normalized || null,
        })
        .eq("id", profileData.id);

      if (error) {
        throw new Error(error.message);
      }

      await refresh();

      setMessage({
        type: "success",
        text: normalized
          ? "Phone number updated successfully."
          : "Phone number removed from your account.",
      });
      setIsEditingPhone(false);
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
        {!isEditingPhone ? (
          <div className="flex items-center gap-3">
            <div className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600">
              {formattedPhoneNumber}
            </div>
            <button
              onClick={startEditing}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-600 rounded-md hover:bg-blue-50"
            >
              {profileData.phone_number ? "Update Phone" : "Add Phone"}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <input
              type="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="+15551234567"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <button
                onClick={handlePhoneNumberUpdate}
                disabled={isLoading || !hasPhoneChanged}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Saving..." : isRemovingPhone ? "Remove Phone" : "Save"}
              </button>
              <button
                onClick={cancelEditing}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Use international format with your country code. Example: +15551234567
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
