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
        <label className="block text-sm font-medium text-ink-700 mb-2">
          Age Range Preference
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-ink-600 mb-1">Minimum Age</label>
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
              className="input-base"
            />
          </div>
          <div>
            <label className="block text-xs text-ink-600 mb-1">Maximum Age</label>
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
              className="input-base"
            />
          </div>
        </div>
        <p className="mt-1 text-xs text-ink-500">
          Matches will be within ages {ageRangeMin} to {ageRangeMax}
        </p>
      </div>

      {/* Distance Radius */}
      <div>
        <label className="block text-sm font-medium text-ink-700 mb-2">
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
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-ink-100 accent-brand-600"
          />
          <div className="flex justify-between text-xs text-ink-500">
            <span>5 miles</span>
            <span className="font-semibold text-brand-600">{distanceRadius} miles</span>
            <span>100 miles</span>
          </div>
        </div>
        <p className="mt-1 text-xs text-ink-500">
          Find friends within {distanceRadius} miles of your location
        </p>
      </div>

      {/* Match Frequency - Display Only */}
      <div>
        <label className="block text-sm font-medium text-ink-700 mb-2">
          Matches per Week
        </label>
        <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
          <p className="text-2xl font-semibold text-ink-900">2 matches</p>
          <p className="mt-1 text-sm text-ink-600">
            We'll send you 2 carefully selected matches every week.
          </p>
        </div>
      </div>

      {/* Save/Cancel Buttons */}
      {isEditing && (
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSavePreferences}
            disabled={isLoading}
            className="rounded-md bg-brand-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Saving..." : "Save Preferences"}
          </button>
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="rounded-md border border-ink-200 px-6 py-2 text-sm font-medium text-ink-700 transition hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Message Display */}
      {message && (
        <div className={message.type === "success" ? "alert-success" : "alert-error"}>
          {message.text}
        </div>
      )}
    </div>
  );
}
