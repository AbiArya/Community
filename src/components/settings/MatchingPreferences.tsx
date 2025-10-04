"use client";

import { useState, useEffect } from "react";
import { useProfileData } from "@/hooks/useProfileData";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function MatchingPreferences() {
  const { data: profileData, refresh } = useProfileData();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  const [ageRangeMin, setAgeRangeMin] = useState(18);
  const [ageRangeMax, setAgeRangeMax] = useState(100);
  const [distanceRadius, setDistanceRadius] = useState(50);

  // Initialize form values when profile data loads
  useEffect(() => {
    if (profileData) {
      setAgeRangeMin(profileData.age_range_min);
      setAgeRangeMax(profileData.age_range_max);
      setDistanceRadius(profileData.distance_radius);
    }
  }, [profileData]);

  if (!profileData) {
    return <div className="text-sm text-gray-500">Loading preferences...</div>;
  }

  const handleSavePreferences = async () => {
    setIsLoading(true);
    setMessage(null);

    // Validation
    if (ageRangeMin >= ageRangeMax) {
      setMessage({
        type: "error",
        text: "Minimum age must be less than maximum age",
      });
      setIsLoading(false);
      return;
    }

    if (ageRangeMin < 18) {
      setMessage({
        type: "error",
        text: "Minimum age must be at least 18",
      });
      setIsLoading(false);
      return;
    }

    try {
      const supabase = getSupabaseBrowserClient();
      
      const { error } = await supabase
        .from("users")
        .update({
          age_range_min: ageRangeMin,
          age_range_max: ageRangeMax,
          distance_radius: distanceRadius,
        })
        .eq("id", profileData.id);

      if (error) throw error;

      setMessage({
        type: "success",
        text: "Preferences updated successfully!",
      });
      setIsEditing(false);
      
      // Refresh profile data
      await refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to update preferences",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset to current profile data
    setAgeRangeMin(profileData.age_range_min);
    setAgeRangeMax(profileData.age_range_max);
    setDistanceRadius(profileData.distance_radius);
    setIsEditing(false);
    setMessage(null);
  };

  return (
    <div className="space-y-6">
      {/* Age Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Age Range Preference
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Minimum Age</label>
            <input
              type="number"
              min="18"
              max={ageRangeMax - 1}
              value={ageRangeMin}
              onChange={(e) => {
                setAgeRangeMin(Number(e.target.value));
                if (!isEditing) setIsEditing(true);
              }}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Maximum Age</label>
            <input
              type="number"
              min={ageRangeMin + 1}
              max="100"
              value={ageRangeMax}
              onChange={(e) => {
                setAgeRangeMax(Number(e.target.value));
                if (!isEditing) setIsEditing(true);
              }}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Matches will be within ages {ageRangeMin} to {ageRangeMax}
        </p>
      </div>

      {/* Distance Radius */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Distance Radius (miles)
        </label>
        <div className="space-y-2">
          <input
            type="range"
            min="5"
            max="100"
            step="5"
            value={distanceRadius}
            onChange={(e) => {
              setDistanceRadius(Number(e.target.value));
              if (!isEditing) setIsEditing(true);
            }}
            disabled={isLoading}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>5 mi</span>
            <span className="font-semibold text-blue-600">{distanceRadius} miles</span>
            <span>100 mi</span>
          </div>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Find friends within {distanceRadius} miles of your location
        </p>
      </div>

      {/* Save/Cancel Buttons */}
      {isEditing && (
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSavePreferences}
            disabled={isLoading}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Saving..." : "Save Preferences"}
          </button>
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="px-6 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      )}

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
