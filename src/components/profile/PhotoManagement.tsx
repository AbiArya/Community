"use client";

import { useState, useRef, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useProfileData } from "@/hooks/useProfileData";
import { useDragReorder } from "@/hooks/useDragReorder";

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
      
      // Update display_order and primary status for all photos
      // First photo is always primary
      const updates = photos.map((photo, index) => ({
        id: photo.id,
        display_order: index,
        is_primary: index === 0,
      }));
      
      for (const update of updates) {
        const { error } = await supabase
          .from("user_photos")
          .update({ 
            display_order: update.display_order,
            is_primary: update.is_primary,
          })
          .eq("id", update.id);
          
        if (error) {
          throw new Error(`Failed to reorder photos: ${error.message}`);
        }
      }

      refresh();
      onUpdate?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsReordering(false);
    }
  }, [session, profile, refresh, onUpdate]);

  const sortedPhotos = profile?.photos ? [...profile.photos].sort((a, b) => a.display_order - b.display_order) : [];

  const { handleDragStart, handleDragOver, handleDragLeave, handleDragEnd, getDragClassName } =
    useDragReorder(sortedPhotos, handleReorder);

  if (!profile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Status Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Upload Section */}
      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/*,image/heic,image/heif"
          multiple
          onChange={(e) => handleFileUpload(e.currentTarget.files)}
          className="hidden"
          aria-label="Upload photos"
          disabled={isUploading || sortedPhotos.length >= 3}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading || sortedPhotos.length >= 3}
          className="px-4 py-2 text-sm font-medium rounded border border-gray-300 bg-white hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Choose Files
        </button>
        <span className="text-xs text-gray-600">
          {3 - sortedPhotos.length} remaining (max 3, 2MB each)
        </span>
      </div>
      {isUploading && (
        <p className="text-sm text-blue-600">Uploading photos...</p>
      )}

      {/* Photos Grid with Drag & Drop */}
      {sortedPhotos.length > 0 ? (
        <div>
          <p className="text-xs text-gray-600 mb-2">Drag to reorder • First photo is your primary photo</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {sortedPhotos.map((photo, index) => (
              <div
                key={photo.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onDragLeave={handleDragLeave}
                className={`border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm cursor-move transition-all ${getDragClassName(
                  index
                )}`}
              >
                <div className="aspect-square bg-gray-50 relative">
                  <img
                    src={photo.photo_url}
                    alt={photo.is_primary ? "Primary photo" : "Profile photo"}
                    className="w-full h-full object-cover pointer-events-none"
                  />
                  {photo.is_primary && (
                    <div className="absolute top-2 left-2 bg-black text-white px-2 py-1 rounded text-xs font-medium">
                      ★ Primary
                    </div>
                  )}
                  <button
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-700 shadow-md font-bold"
                    onClick={() => handleDeletePhoto(photo.id, photo.photo_url)}
                    disabled={isDeleting === photo.id}
                    aria-label="Remove photo"
                    title="Remove photo"
                    style={{ color: '#ffffff' }}
                  >
                    {isDeleting === photo.id ? '...' : '×'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
          <p className="text-gray-500">No photos uploaded yet</p>
          <p className="text-sm text-gray-400 mt-1">Upload your first photo to get started</p>
        </div>
      )}
    </div>
  );
}
