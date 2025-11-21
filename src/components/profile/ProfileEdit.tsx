"use client";

import { useProfileData } from "@/hooks/useProfileData";
import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthSession } from "@/hooks/useAuthSession";
import { PhotoManagement } from "./PhotoManagement";
import { HobbyManagement } from "./HobbyManagement";
import { validateAndNormalizeZipcode, zipcodeToLocation, isValidZipcode } from "@/lib/utils/zipcode";

interface ProfileEditProps {
  onSaveSuccess?: () => void;
}

export function ProfileEdit({ onSaveSuccess }: ProfileEditProps = {}) {
  const { data: profile, isLoading, error, refresh } = useProfileData();
  const { session } = useAuthSession();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    full_name: "",
    bio: "",
    zipcode: "",
    age: "" as string | number,
    age_range_min: 18,
    age_range_max: 100,
    distance_radius: 50,
  });
  
  // Zipcode validation state
  const [zipcodeError, setZipcodeError] = useState<string>("");
  const [locationDisplay, setLocationDisplay] = useState<string>("");

  // Local hobby state for editing
  const [localHobbies, setLocalHobbies] = useState<UserHobby[]>([]);

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        bio: profile.bio || "",
        zipcode: profile.zipcode || "",
        age: profile.age?.toString() || "",
        age_range_min: profile.age_range_min || 18,
        age_range_max: profile.age_range_max || 100,
        distance_radius: profile.distance_radius || 50,
      });
      // Initialize local hobbies
      setLocalHobbies(profile.hobbies || []);
      
      // Show location for existing zipcode
      if (profile.zipcode) {
        const location = zipcodeToLocation(profile.zipcode);
        if (location) {
          setLocationDisplay(location);
        }
      }
    }
  }, [profile]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear zipcode error when user types
    if (field === "zipcode") {
      setZipcodeError("");
      setLocationDisplay("");
    }
  };
  
  const validateZipcode = () => {
    const zip = formData.zipcode.trim();
    if (!zip) {
      setZipcodeError("Zipcode is required");
      setLocationDisplay("");
      return false;
    }
    
    if (!isValidZipcode(zip)) {
      setZipcodeError("Please enter a valid US zipcode");
      setLocationDisplay("");
      return false;
    }
    
    // Show location for valid zipcode
    const location = zipcodeToLocation(zip);
    if (location) {
      setLocationDisplay(location);
    }
    
    setZipcodeError("");
    return true;
  };

  const handleNumberInputChange = (field: string, value: string) => {
    // Handle empty string or invalid numbers
    const numValue = value === '' ? '' : parseInt(value);
    if (value === '' || (!isNaN(numValue) && numValue >= 0)) {
      setFormData(prev => ({
        ...prev,
        [field]: value === '' ? '' : numValue
      }));
    }
  };

  const handleSave = async () => {
    if (!session || !profile) return;

    // Validate zipcode before saving
    if (!validateZipcode()) {
      setSaveError("Please enter a valid zipcode");
      return;
    }

    setSaveError(null);
    setSaveSuccess(false);
    setIsSaving(true);

    try {
      const supabase = getSupabaseBrowserClient();
      
      // Validate and convert zipcode to coordinates
      const { zipcode, latitude, longitude } = validateAndNormalizeZipcode(formData.zipcode);

      // Prepare update data
      const updateData: {
        full_name: string;
        bio: string | null;
        zipcode: string;
        latitude: number;
        longitude: number;
        age: number | null;
        age_range_min: number;
        age_range_max: number;
        distance_radius: number;
        updated_at: string;
      } = {
        full_name: formData.full_name,
        bio: formData.bio,
        zipcode,
        latitude,
        longitude,
        age: formData.age && formData.age !== '' ? (typeof formData.age === 'number' ? formData.age : parseInt(formData.age)) : null,
        age_range_min: formData.age_range_min,
        age_range_max: formData.age_range_max,
        distance_radius: formData.distance_radius,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", session.user.id);

      if (error) {
        throw error;
      }

      // Save hobby changes
      await saveHobbyChanges();

      setSaveSuccess(true);
      console.log('Profile saved successfully, calling onSaveSuccess callback...');
      
      // Wait a moment for database consistency
      await new Promise(resolve => setTimeout(resolve, 200));
      onSaveSuccess?.();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsSaving(false);
    }
  };

  const saveHobbyChanges = async () => {
    if (!session) return;

    const supabase = getSupabaseBrowserClient();
    
    console.log('Saving hobby changes, localHobbies:', localHobbies);
    
    // Get current hobbies from database
    const { data: currentHobbies, error: fetchError } = await supabase
      .from("user_hobbies")
      .select("*")
      .eq("user_id", session.user.id);

    if (fetchError) {
      throw new Error(`Failed to fetch current hobbies: ${fetchError.message}`);
    }

    console.log('Current hobbies in database:', currentHobbies);

    // Delete all current hobbies
    if (currentHobbies && currentHobbies.length > 0) {
      const { error: deleteError } = await supabase
        .from("user_hobbies")
        .delete()
        .eq("user_id", session.user.id);

      if (deleteError) {
        throw new Error(`Failed to delete current hobbies: ${deleteError.message}`);
      }
      console.log('Deleted current hobbies');
    }

    // Insert new hobbies
    if (localHobbies.length > 0) {
      const hobbiesToInsert = localHobbies.map(hobby => ({
        user_id: session.user.id,
        hobby_id: hobby.hobby_id,
        preference_rank: hobby.preference_rank,
      }));

      console.log('Inserting hobbies:', hobbiesToInsert);

      const { error: insertError } = await supabase
        .from("user_hobbies")
        .insert(hobbiesToInsert);

      if (insertError) {
        console.error('Hobby insert error:', insertError);
        throw new Error(`Failed to save hobbies: ${insertError.message}`);
      }
      console.log('Successfully inserted hobbies');
    } else {
      console.log('No hobbies to insert');
    }
  };

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit Profile</h1>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {saveError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">Error saving profile: {saveError}</p>
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">Profile updated successfully!</p>
        </div>
      )}

      {/* Photo Management */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Photos</h2>
        <PhotoManagement onUpdate={refresh} />
      </div>

      {/* Basic Information */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              id="full_name"
              value={formData.full_name}
              onChange={(e) => handleInputChange("full_name", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="Enter your full name"
            />
          </div>
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
              Age
            </label>
            <input
              type="number"
              id="age"
              value={formData.age}
              onChange={(e) => handleNumberInputChange("age", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="Enter your age"
              min="18"
              max="100"
            />
          </div>
        </div>
        <div>
          <label htmlFor="zipcode" className="block text-sm font-medium text-gray-700 mb-1">
            Zipcode <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="zipcode"
            value={formData.zipcode}
            onChange={(e) => handleInputChange("zipcode", e.target.value)}
            onBlur={validateZipcode}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent ${
              zipcodeError ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., 94102"
            maxLength={10}
            autoComplete="postal-code"
          />
          {zipcodeError && (
            <p className="text-xs text-red-600 mt-1">{zipcodeError}</p>
          )}
          {locationDisplay && !zipcodeError && (
            <p className="text-xs text-green-600 mt-1">✓ {locationDisplay}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            We use your zipcode for distance-based matching
          </p>
        </div>
      </div>

      {/* Hobby Management */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Hobbies & Interests</h2>
        <HobbyManagement onUpdate={refresh} onHobbiesChange={setLocalHobbies} />
      </div>

      {/* Bio */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">About Me</h2>
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
            Bio
          </label>
          <textarea
            id="bio"
            value={formData.bio}
            onChange={(e) => handleInputChange("bio", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            placeholder="Tell us about yourself..."
            rows={4}
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.bio.length}/500 characters
          </p>
        </div>
      </div>

      {/* Matching Preferences */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Matching Preferences</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="age_range_min" className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Age
            </label>
            <input
              type="number"
              id="age_range_min"
              value={formData.age_range_min}
              onChange={(e) => handleNumberInputChange("age_range_min", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              min="18"
              max="100"
            />
          </div>
          <div>
            <label htmlFor="age_range_max" className="block text-sm font-medium text-gray-700 mb-1">
              Maximum Age
            </label>
            <input
              type="number"
              id="age_range_max"
              value={formData.age_range_max}
              onChange={(e) => handleNumberInputChange("age_range_max", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              min="18"
              max="100"
            />
          </div>
          <div>
            <label htmlFor="distance_radius" className="block text-sm font-medium text-gray-700 mb-1">
              Distance (km)
            </label>
            <input
              type="number"
              id="distance_radius"
              value={formData.distance_radius}
              onChange={(e) => handleNumberInputChange("distance_radius", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              min="1"
              max="500"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
