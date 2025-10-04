"use client";

import { useState, useRef, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useProfileData } from "@/hooks/useProfileData";

interface PhotoManagementProps {
  onUpdate?: () => void;
}

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ACCEPT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

export function PhotoManagement({ onUpdate }: PhotoManagementProps) {
  const { session } = useAuthSession();
  const { data: profile, refresh } = useProfileData();
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || !session || !profile) return;
    
    setError(null);
    setSuccess(null);
    setIsUploading(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const uploadedPhotos = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file
        const isAcceptableType = ACCEPT_TYPES.includes(file.type) || file.type.startsWith("image/");
        if (!isAcceptableType) {
          throw new Error("Unsupported file type. Please upload JPG, PNG, WEBP, or HEIC.");
        }

        if (file.size > MAX_SIZE_BYTES) {
          throw new Error("Each photo must be under 2MB.");
        }

        // Check if we're at the limit
        if (profile.photos.length + uploadedPhotos.length >= 3) {
          throw new Error("Maximum of 3 photos allowed.");
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${session.user.id}/${Date.now()}-${i}.${fileExt}`;
        
        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('user-photos')
          .upload(fileName, file);
          
        if (uploadError) {
          throw new Error(`Failed to upload photo: ${uploadError.message}`);
        }
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('user-photos')
          .getPublicUrl(fileName);
          
        uploadedPhotos.push({
          user_id: session.user.id,
          photo_url: urlData.publicUrl,
          display_order: profile.photos.length + uploadedPhotos.length,
          is_primary: profile.photos.length === 0 && uploadedPhotos.length === 0,
        });
      }

      // Save to database
      if (uploadedPhotos.length > 0) {
        const { error: insertError } = await supabase
          .from("user_photos")
          .insert(uploadedPhotos);
          
        if (insertError) {
          throw new Error(`Failed to save photos: ${insertError.message}`);
        }
      }

      setSuccess(`Successfully uploaded ${uploadedPhotos.length} photo(s)`);
      refresh();
      onUpdate?.();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }, [session, profile, refresh, onUpdate]);

  const handleDeletePhoto = useCallback(async (photoId: string, photoUrl: string) => {
    if (!session) return;
    
    setError(null);
    setIsDeleting(photoId);

    try {
      const supabase = getSupabaseBrowserClient();
      
      // Delete from storage
      const fileName = photoUrl.split('/').pop();
      if (fileName) {
        const { error: storageError } = await supabase.storage
          .from('user-photos')
          .remove([`${session.user.id}/${fileName}`]);
          
        if (storageError) {
          console.warn('Failed to delete from storage:', storageError);
        }
      }
      
      // Delete from database
      const { error: deleteError } = await supabase
        .from("user_photos")
        .delete()
        .eq("id", photoId);
        
      if (deleteError) {
        throw new Error(`Failed to delete photo: ${deleteError.message}`);
      }

      // If this was the primary photo, make the first remaining photo primary
      if (profile?.photos.find(p => p.id === photoId)?.is_primary) {
        const remainingPhotos = profile.photos.filter(p => p.id !== photoId);
        if (remainingPhotos.length > 0) {
          const { error: updateError } = await supabase
            .from("user_photos")
            .update({ is_primary: true })
            .eq("id", remainingPhotos[0].id);
            
          if (updateError) {
            console.warn('Failed to update primary photo:', updateError);
          }
        }
      }

      setSuccess("Photo deleted successfully");
      refresh();
      onUpdate?.();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsDeleting(null);
    }
  }, [session, profile, refresh, onUpdate]);

  const handleSetPrimary = useCallback(async (photoId: string) => {
    if (!session) return;
    
    setError(null);
    setIsReordering(true);

    try {
      const supabase = getSupabaseBrowserClient();
      
      // First, unset all primary photos
      const { error: unsetError } = await supabase
        .from("user_photos")
        .update({ is_primary: false })
        .eq("user_id", session.user.id);
        
      if (unsetError) {
        throw new Error(`Failed to update photos: ${unsetError.message}`);
      }
      
      // Then set the selected photo as primary
      const { error: setError } = await supabase
        .from("user_photos")
        .update({ is_primary: true })
        .eq("id", photoId);
        
      if (setError) {
        throw new Error(`Failed to set primary photo: ${setError.message}`);
      }

      setSuccess("Primary photo updated");
      refresh();
      onUpdate?.();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsReordering(false);
    }
  }, [session, refresh, onUpdate]);

  const handleReorder = useCallback(async (fromIndex: number, toIndex: number) => {
    if (!session || !profile) return;
    
    setError(null);
    setIsReordering(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const photos = [...profile.photos].sort((a, b) => a.display_order - b.display_order);
      
      // Reorder the array
      const [movedPhoto] = photos.splice(fromIndex, 1);
      photos.splice(toIndex, 0, movedPhoto);
      
      // Update display_order for all photos
      const updates = photos.map((photo, index) => ({
        id: photo.id,
        display_order: index,
      }));
      
      for (const update of updates) {
        const { error } = await supabase
          .from("user_photos")
          .update({ display_order: update.display_order })
          .eq("id", update.id);
          
        if (error) {
          throw new Error(`Failed to reorder photos: ${error.message}`);
        }
      }

      setSuccess("Photos reordered successfully");
      refresh();
      onUpdate?.();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsReordering(false);
    }
  }, [session, profile, refresh, onUpdate]);

  if (!profile) {
    return <div>Loading...</div>;
  }

  const sortedPhotos = [...profile.photos].sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="space-y-4">
      {/* Status Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Upload Section */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium">Add Photos</h3>
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/*,image/heic,image/heif"
            multiple
            onChange={(e) => handleFileUpload(e.currentTarget.files)}
            className="block text-sm"
            aria-label="Upload photos"
            disabled={isUploading || sortedPhotos.length >= 3}
          />
          <span className="text-xs text-gray-500">
            {sortedPhotos.length}/3 photos (max 2MB each)
          </span>
        </div>
        {isUploading && (
          <p className="text-sm text-blue-600">Uploading photos...</p>
        )}
      </div>

      {/* Photos Grid */}
      {sortedPhotos.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Your Photos</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sortedPhotos.map((photo, index) => (
              <div key={photo.id} className="relative border rounded-lg overflow-hidden">
                <div className="aspect-square bg-gray-50 relative">
                  <img
                    src={photo.photo_url}
                    alt={`Profile photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {photo.is_primary && (
                    <span className="absolute top-2 left-2 px-2 py-1 text-xs bg-black text-white rounded">
                      Primary
                    </span>
                  )}
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      className={`px-3 py-1 text-xs rounded ${
                        photo.is_primary 
                          ? "bg-black text-white" 
                          : "border border-gray-300 hover:bg-gray-50"
                      }`}
                      onClick={() => handleSetPrimary(photo.id)}
                      disabled={isReordering}
                    >
                      {photo.is_primary ? "Primary" : "Make Primary"}
                    </button>
                    <button
                      className="px-3 py-1 text-xs rounded border border-red-300 text-red-600 hover:bg-red-50"
                      onClick={() => handleDeletePhoto(photo.id, photo.photo_url)}
                      disabled={isDeleting === photo.id}
                    >
                      {isDeleting === photo.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                  
                  {/* Reorder buttons */}
                  {sortedPhotos.length > 1 && (
                    <div className="flex items-center justify-center gap-1">
                      <button
                        className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                        onClick={() => handleReorder(index, index - 1)}
                        disabled={index === 0 || isReordering}
                      >
                        ↑
                      </button>
                      <span className="text-xs text-gray-500 px-2">
                        {index + 1}
                      </span>
                      <button
                        className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                        onClick={() => handleReorder(index, index + 1)}
                        disabled={index === sortedPhotos.length - 1 || isReordering}
                      >
                        ↓
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sortedPhotos.length === 0 && (
        <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
          <p className="text-gray-500">No photos uploaded yet</p>
          <p className="text-sm text-gray-400 mt-1">Upload your first photo to get started</p>
        </div>
      )}
    </div>
  );
}
