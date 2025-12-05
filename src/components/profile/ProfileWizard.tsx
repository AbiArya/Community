"use client";

import { useState } from "react";
import { PhotoUpload, type UploadedPhoto } from "@/components/profile/PhotoUpload";
import { HobbySelector, type RankedHobby } from "@/components/profile/HobbySelector";
import { DescriptionStep } from "@/components/profile/DescriptionStep";
import { PreferencesStep } from "@/components/profile/PreferencesStep";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useRouter } from "next/navigation";
import { validateAndNormalizeZipcode } from "@/lib/utils/zipcode-client";
import { uploadPhotoToS3 } from "@/lib/aws/storage-client";
import { clearProfileCache } from "@/hooks/useProfileData";

type WizardStep = 0 | 1 | 2 | 3;

export function ProfileWizard() {
  const [currentStep, setCurrentStep] = useState<WizardStep>(0);
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [hobbies, setHobbies] = useState<RankedHobby[]>([]);
  const [name, setName] = useState<string>("");
  const [age, setAge] = useState<string>("");
  const [bio, setBio] = useState<string>("");
  const [prefs, setPrefs] = useState({ zipcode: "", ageMin: 21, ageMax: 45, distanceMiles: 25 });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { session } = useAuthSession();
  const router = useRouter();

  function next() {
    setCurrentStep((s) => (s < 3 ? ((s + 1) as WizardStep) : s));
  }

  function prev() {
    setCurrentStep((s) => (s > 0 ? ((s - 1) as WizardStep) : s));
  }

  async function completeProfile() {
    setSaveError(null);
    try {
      setIsSaving(true);
      const supabase = getSupabaseBrowserClient();
      if (!session) {
        throw new Error("Not authenticated");
      }
      
      // Validate and convert zipcode to coordinates
      const { zipcode, latitude, longitude } = validateAndNormalizeZipcode(prefs.zipcode);
      
      // Upload photos to S3
      const uploadedPhotos = [];
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        const result = await uploadPhotoToS3(photo.file, session.access_token);
          
        uploadedPhotos.push({
          photo_url: result.cloudFrontUrl,
          storage_path: result.s3Key,
          display_order: i,
          is_primary: photo.isPrimary,
        });
      }
      
      // Check if the user exists
      const { data: currentUser, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();
      
      if (fetchError) {
        throw new Error(`Failed to fetch user data: ${fetchError.message}`);
      }
        
      let data, error;
      
      if (!currentUser) {
        // User doesn't exist, create them
        const { data: insertResult, error: insertError } = await supabase
          .from("users")
          .insert({
            id: session.user.id,
            email: session.user.email!,
            full_name: name.trim(),
            age: age && age !== '' ? parseInt(age) : null,
            bio,
            zipcode,
            latitude,
            longitude,
            is_profile_complete: true,
            match_frequency: 2,
            age_range_min: prefs.ageMin,
            age_range_max: prefs.ageMax,
            distance_radius: prefs.distanceMiles,
          })
          .select();
          
        data = insertResult;
        error = insertError;
      } else {
        // User exists, update them
        const { data: updateData, error: updateError } = await supabase
          .from("users")
          .update({
            full_name: name.trim(),
            age: age && age !== '' ? parseInt(age) : null,
            bio,
            zipcode,
            latitude,
            longitude,
            is_profile_complete: true,
            match_frequency: 2,
            age_range_min: prefs.ageMin,
            age_range_max: prefs.ageMax,
            distance_radius: prefs.distanceMiles,
          })
          .eq("id", session.user.id)
          .select();
          
        data = updateData;
        error = updateError;
      }
      
      if (error) {
        throw error;
      }
      
      // Save photos to user_photos table
      if (uploadedPhotos.length > 0) {
        const photosToInsert = uploadedPhotos.map(photo => ({
          user_id: session.user.id,
          ...photo,
        }));
        
        const { error: photosError } = await supabase
          .from("user_photos")
          .insert(photosToInsert);
          
        if (photosError) {
          throw new Error(`Failed to save photos: ${photosError.message}`);
        }
      }
      
      // Save hobbies to user_hobbies table
      if (hobbies.length > 0) {
        const hobbiesToInsert = hobbies.map(hobby => ({
          user_id: session.user.id,
          hobby_id: hobby.id,
          preference_rank: hobby.rank,
        }));
        
        const { error: hobbiesError } = await supabase
          .from("user_hobbies")
          .insert(hobbiesToInsert);
          
        if (hobbiesError) {
          throw new Error(`Failed to save hobbies: ${hobbiesError.message}`);
        }
      }
      
      // Clear profile cache so the profile page fetches fresh data
      clearProfileCache(session.user.id);
      
      // Redirect to profile page
      router.push("/profile");
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <ol className="flex items-center gap-2 text-xs">
        <li className={`px-2 py-1 rounded ${currentStep === 0 ? "bg-black text-white" : "bg-gray-200 text-gray-700"}`}>Photos</li>
        <li className={`px-2 py-1 rounded ${currentStep === 1 ? "bg-black text-white" : "bg-gray-200 text-gray-700"}`}>Hobbies</li>
        <li className={`px-2 py-1 rounded ${currentStep === 2 ? "bg-black text-white" : "bg-gray-200 text-gray-700"}`}>About you</li>
        <li className={`px-2 py-1 rounded ${currentStep === 3 ? "bg-black text-white" : "bg-gray-200 text-gray-700"}`}>Preferences</li>
      </ol>

      <div className="rounded-lg border border-gray-300 bg-gray-50 p-4 min-h-48">
        {currentStep === 0 && (
          <div className="space-y-3">
            <p className="font-medium text-gray-900">Photos</p>
            <p className="text-sm text-gray-600">Upload 2-3 photos. Max 2MB each.</p>
            <PhotoUpload photos={photos} onChange={setPhotos} maxPhotos={3} />
          </div>
        )}
        {currentStep === 1 && (
          <div className="space-y-3">
            <p className="font-medium text-gray-900">Hobbies</p>
            <p className="text-sm text-gray-600">Search and rank your top hobbies.</p>
            <HobbySelector selected={hobbies} onChange={setHobbies} />
          </div>
        )}
        {currentStep === 2 && (
          <DescriptionStep value={bio} onChange={setBio} name={name} onNameChange={setName} age={age} onAgeChange={setAge} />
        )}
        {currentStep === 3 && (
          <PreferencesStep value={prefs} onChange={setPrefs} />
        )}
      </div>

      {saveError && (
        <p className="text-sm text-red-600" role="alert">{saveError}</p>
      )}

      <div className="flex items-center justify-between">
        <button
          className="px-4 py-2 text-sm font-medium rounded border border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed shadow-sm"
          style={{
            backgroundColor: currentStep === 0 ? '#f3f4f6' : '#ffffff',
            color: currentStep === 0 ? '#6b7280' : '#111827'
          }}
          onClick={prev}
          disabled={currentStep === 0}
        >
          Back
        </button>
        {currentStep < 3 ? (
          <button
            className="px-4 py-2 text-sm font-medium rounded hover:bg-gray-800 disabled:cursor-not-allowed shadow-sm"
            style={{
              backgroundColor: (currentStep === 0 && photos.length < 2) ||
                (currentStep === 1 && hobbies.length < 1) ||
                (currentStep === 2 && (name.trim().length < 2 || bio.trim().length < 20))
                ? '#d1d5db'
                : '#000000',
              color: (currentStep === 0 && photos.length < 2) ||
                (currentStep === 1 && hobbies.length < 1) ||
                (currentStep === 2 && (name.trim().length < 2 || bio.trim().length < 20))
                ? '#1f2937'
                : '#ffffff'
            }}
            onClick={next}
            disabled={
              (currentStep === 0 && photos.length < 2) ||
              (currentStep === 1 && hobbies.length < 1) ||
              (currentStep === 2 && (name.trim().length < 2 || bio.trim().length < 20))
            }
          >
            {currentStep === 0 && photos.length < 2
              ? "Add at least 2 photos"
              : currentStep === 1 && hobbies.length < 1
              ? "Select at least 1 hobby"
              : currentStep === 2 && name.trim().length < 2
              ? "Enter your name"
              : currentStep === 2 && bio.trim().length < 20
              ? "Write at least 20 characters"
              : "Next"}
          </button>
        ) : (
          <button
            className="px-4 py-2 text-sm font-medium rounded hover:bg-gray-800 disabled:cursor-not-allowed shadow-sm"
            style={{
              backgroundColor: isSaving || !prefs.zipcode.trim() ? '#d1d5db' : '#000000',
              color: isSaving || !prefs.zipcode.trim() ? '#1f2937' : '#ffffff'
            }}
            onClick={completeProfile}
            disabled={isSaving || !prefs.zipcode.trim()}
          >
            {isSaving ? "Saving..." : !prefs.zipcode.trim() ? "Enter zipcode" : "Complete Profile"}
          </button>
        )}
      </div>
    </div>
  );
}


