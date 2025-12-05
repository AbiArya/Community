"use client";

import { useProfileData, type UserHobby, type UserPhoto } from "@/hooks/useProfileData";
import { useState, useEffect, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthSession } from "@/hooks/useAuthSession";
import { PhotoManagement, type PendingPhoto, type PhotoOperation } from "./PhotoManagement";
import { HobbyManagement } from "./HobbyManagement";
import { validateAndNormalizeZipcode, zipcodeToLocation, isValidZipcode, isValidZipcodeFormat } from "@/lib/utils/zipcode-client";
import { uploadPhotoToS3, deletePhotosFromS3 } from "@/lib/aws/storage-client";

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

  // Local photo state for editing
  const [localPhotos, setLocalPhotos] = useState<(UserPhoto | PendingPhoto)[]>([]);
  const [photosToDelete, setPhotosToDelete] = useState<Array<{ id: string; storagePath: string | null }>>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);

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
      
      // Initialize local photos
      setLocalPhotos(profile.photos || []);
      setPhotosToDelete([]);
      setPhotoError(null);
      
      // Show location for existing zipcode
      if (profile.zipcode) {
        zipcodeToLocation(profile.zipcode).then(location => {
          if (location) {
            setLocationDisplay(location);
          }
        });
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
  
  const [isValidatingZipcode, setIsValidatingZipcode] = useState(false);
  
  const validateZipcode = useCallback(async (): Promise<boolean> => {
    const zip = formData.zipcode.trim();
    if (!zip) {
      setZipcodeError("Zipcode is required");
      setLocationDisplay("");
      return false;
    }
    
    // Quick format check first (synchronous)
    if (!isValidZipcodeFormat(zip)) {
      setZipcodeError("Please enter a valid US zipcode");
      setLocationDisplay("");
      return false;
    }
    
    setIsValidatingZipcode(true);
    
    try {
      const valid = await isValidZipcode(zip);
      if (!valid) {
        setZipcodeError("Please enter a valid US zipcode");
        setLocationDisplay("");
        return false;
      }
      
      // Show location for valid zipcode
      const location = await zipcodeToLocation(zip);
      if (location) {
        setLocationDisplay(location);
      }
      
      setZipcodeError("");
      return true;
    } finally {
      setIsValidatingZipcode(false);
    }
  }, [formData.zipcode]);

  const handleNumberInputChange = (field: string, value: string) => {
    const trimmed = value.trim();
    if (trimmed === "") {
      setFormData(prev => ({ ...prev, [field]: "" }));
      return;
    }

    const parsed = Number(trimmed);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      setFormData(prev => ({ ...prev, [field]: parsed }));
    }
  };

  const handlePhotoChange = (operation: PhotoOperation) => {
    setPhotoError(null);
    
    if (operation.type === 'add') {
      // Create pending photos with preview URLs
      const pendingPhotos: PendingPhoto[] = operation.files.map((file, index) => ({
        id: `pending-${Date.now()}-${index}`,
        file,
        preview_url: URL.createObjectURL(file),
        display_order: localPhotos.length + index,
        is_primary: localPhotos.length === 0 && index === 0,
      }));
      
      setLocalPhotos(prev => [...prev, ...pendingPhotos]);
    } else if (operation.type === 'delete') {
      const photoToDelete = localPhotos.find(p => p.id === operation.photoId);
      
      // Track for deletion if it's an existing photo
      if (photoToDelete && !('file' in photoToDelete)) {
        setPhotosToDelete(prev => [...prev, { 
          id: operation.photoId, 
          storagePath: operation.storagePath 
        }]);
      }
      
      // Remove from preview URL if it's a pending photo
      if (photoToDelete && 'file' in photoToDelete) {
        URL.revokeObjectURL(photoToDelete.preview_url);
      }
      
      // Remove from local photos
      const filtered = localPhotos.filter(p => p.id !== operation.photoId);
      
      // Reindex and update primary
      const reindexed = filtered.map((photo, index) => ({
        ...photo,
        display_order: index,
        is_primary: index === 0,
      }));
      
      setLocalPhotos(reindexed);
    } else if (operation.type === 'reorder') {
      setLocalPhotos(operation.photos);
    }
  };

  const handleSave = async () => {
    if (!session || !profile) return;

    // Validate zipcode before saving
    const isZipcodeValid = await validateZipcode();
    if (!isZipcodeValid) {
      setSaveError("Please enter a valid zipcode");
      return;
    }

    setSaveError(null);
    setSaveSuccess(false);
    setPhotoError(null);
    setIsSaving(true);

    try {
      const supabase = getSupabaseBrowserClient();
      
      // Validate and convert zipcode to coordinates
      const { zipcode, latitude, longitude } = await validateAndNormalizeZipcode(formData.zipcode);

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

      // Save photo changes
      await savePhotoChanges();

      setSaveSuccess(true);
      
      // Wait a moment for database consistency, then refresh to get updated data
      await new Promise(resolve => setTimeout(resolve, 200));
      await refresh();
      onSaveSuccess?.();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsSaving(false);
    }
  };

  const savePhotoChanges = async () => {
    if (!session) return;

    const supabase = getSupabaseBrowserClient();
    const existingPhotos = localPhotos.filter((p): p is UserPhoto => !('file' in p));
    const pendingPhotos = localPhotos.filter((p): p is PendingPhoto => 'file' in p);

    // Step 1: Delete photos from S3 storage
    if (photosToDelete.length > 0) {
      const storagePaths = photosToDelete
        .map(p => p.storagePath)
        .filter((path): path is string => !!path);
      
      if (storagePaths.length > 0) {
        try {
          await deletePhotosFromS3(storagePaths, session.access_token);
        } catch (err) {
          console.warn('Failed to delete from S3:', err);
        }
      }
      
      // Delete from database
      const idsToDelete = photosToDelete.map(p => p.id);
      const { error: deleteError } = await supabase
        .from("user_photos")
        .delete()
        .in("id", idsToDelete);
        
      if (deleteError) {
        throw new Error(`Failed to delete photos: ${deleteError.message}`);
      }
    }

    // Step 2: Upload new photos to S3
    const uploadedPhotos: Array<{
      user_id: string;
      photo_url: string;
      storage_path: string;
      display_order: number;
      is_primary: boolean;
    }> = [];

    for (const pending of pendingPhotos) {
      const result = await uploadPhotoToS3(pending.file, session.access_token);
        
      uploadedPhotos.push({
        user_id: session.user.id,
        photo_url: result.cloudFrontUrl,
        storage_path: result.s3Key,
        display_order: pending.display_order,
        is_primary: pending.is_primary,
      });
      
      URL.revokeObjectURL(pending.preview_url);
    }

    // Step 3: Batch insert new photos
    if (uploadedPhotos.length > 0) {
      const { error: insertError } = await supabase
        .from("user_photos")
        .insert(uploadedPhotos);
        
      if (insertError) {
        throw new Error(`Failed to save photos: ${insertError.message}`);
      }
    }

    // Step 4: Batch update existing photos (order and primary status)
    if (existingPhotos.length > 0) {
      for (const photo of existingPhotos) {
        const { error: updateError } = await supabase
          .from("user_photos")
          .update({
            display_order: photo.display_order,
            is_primary: photo.is_primary,
          })
          .eq("id", photo.id);
          
        if (updateError) {
          throw new Error(`Failed to update photo order: ${updateError.message}`);
        }
      }
    }
  };

  const saveHobbyChanges = async () => {
    if (!session) return;

    const supabase = getSupabaseBrowserClient();
    type UserHobbyRow = {
      id: string;
      user_id: string;
      hobby_id: string;
      preference_rank: number;
    };
    
    // Get current hobbies from database
    const { data: currentHobbies, error: fetchError } = await supabase
      .from("user_hobbies")
      .select("id, user_id, hobby_id, preference_rank")
      .eq("user_id", session.user.id);

    if (fetchError) {
      throw new Error(`Failed to fetch current hobbies: ${fetchError.message}`);
    }

    const normalizedCurrentHobbies: UserHobbyRow[] = (currentHobbies ?? []).flatMap(
      (hobby) => {
        if (!hobby || !hobby.id || !hobby.hobby_id) {
          return [];
        }

        return [
          {
            id: hobby.id,
            user_id: hobby.user_id ?? session.user.id,
            hobby_id: hobby.hobby_id,
            preference_rank: hobby.preference_rank ?? 0,
          },
        ];
      }
    );

    const currentHobbyMap = new Map(
      normalizedCurrentHobbies.map((hobby) => [hobby.hobby_id, hobby])
    );
    const desiredHobbyMap = new Map(
      localHobbies.map((hobby) => [hobby.hobby_id, hobby])
    );

    const hobbiesToInsert: Array<Omit<UserHobbyRow, "id">> = [];
    const hobbiesToUpdate: UserHobbyRow[] = [];

    for (const hobby of localHobbies) {
      if (!hobby.hobby_id) continue; // Skip if no hobby_id
      const existing = currentHobbyMap.get(hobby.hobby_id);

      if (!existing) {
        hobbiesToInsert.push({
          user_id: session.user.id,
          hobby_id: hobby.hobby_id,
          preference_rank: hobby.preference_rank,
        });
        continue;
      }

      if (existing.preference_rank !== hobby.preference_rank) {
        hobbiesToUpdate.push({
          id: existing.id,
          user_id: session.user.id,
          hobby_id: existing.hobby_id,
          preference_rank: hobby.preference_rank,
        });
      }
    }

    const hobbiesToDelete = normalizedCurrentHobbies
      .filter((hobby) => !desiredHobbyMap.has(hobby.hobby_id))
      .map((hobby) => hobby.id);

    if (hobbiesToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from("user_hobbies")
        .delete()
        .in("id", hobbiesToDelete);

      if (deleteError) {
        throw new Error(`Failed to remove hobbies: ${deleteError.message}`);
      }
    }

    if (hobbiesToUpdate.length > 0) {
      const TEMP_RANK_OFFSET = 1000;
      // Two-phase update avoids unique constraint collisions while ranks swap
      const tempUpdates = hobbiesToUpdate.map((hobby) => ({
        ...hobby,
        preference_rank: hobby.preference_rank + TEMP_RANK_OFFSET,
      }));

      const { error: tempUpdateError } = await supabase
        .from("user_hobbies")
        .upsert(tempUpdates, { onConflict: "id" });

      if (tempUpdateError) {
        throw new Error(
          `Failed to prepare hobby rank updates: ${tempUpdateError.message}`
        );
      }

      const { error: finalUpdateError } = await supabase
        .from("user_hobbies")
        .upsert(hobbiesToUpdate, { onConflict: "id" });

      if (finalUpdateError) {
        throw new Error(
          `Failed to update hobby ranks: ${finalUpdateError.message}`
        );
      }
    }

    if (hobbiesToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("user_hobbies")
        .insert(hobbiesToInsert);

      if (insertError) {
        throw new Error(`Failed to add hobbies: ${insertError.message}`);
      }
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
        <PhotoManagement 
          photos={localPhotos}
          onPhotoChange={handlePhotoChange}
          error={photoError}
        />
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
          {isValidatingZipcode && (
            <p className="text-xs text-gray-500 mt-1">Validating...</p>
          )}
          {zipcodeError && !isValidatingZipcode && (
            <p className="text-xs text-red-600 mt-1">{zipcodeError}</p>
          )}
          {locationDisplay && !zipcodeError && !isValidatingZipcode && (
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
              Distance (miles)
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

      {/* Save/Cancel Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          onClick={() => {
            // Revert all changes
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
              setLocalHobbies(profile.hobbies || []);
              
              // Clean up pending photo preview URLs
              localPhotos.filter((p): p is PendingPhoto => 'file' in p)
                .forEach(p => URL.revokeObjectURL(p.preview_url));
              
              setLocalPhotos(profile.photos || []);
              setPhotosToDelete([]);
              setPhotoError(null);
              setSaveError(null);
              setZipcodeError("");
              
              if (profile.zipcode) {
                const location = zipcodeToLocation(profile.zipcode);
                if (location) {
                  setLocationDisplay(location);
                }
              }
            }
          }}
          disabled={isSaving}
          className="px-6 py-2 font-medium border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving || !!zipcodeError}
          className="px-6 py-2 font-medium bg-black !text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
