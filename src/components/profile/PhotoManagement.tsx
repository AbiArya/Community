"use client";

import Image from "next/image";
import { useState, useRef, useCallback } from "react";
import { useDragReorder } from "@/hooks/useDragReorder";
import type { UserPhoto } from "@/hooks/useProfileData";

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ACCEPT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

export type PendingPhoto = {
  id: string;
  file: File;
  preview_url: string;
  display_order: number;
  is_primary: boolean;
};

export type PhotoOperation = 
  | { type: 'add'; files: File[] }
  | { type: 'delete'; photoId: string; storagePath: string | null }
  | { type: 'reorder'; photos: (UserPhoto | PendingPhoto)[] };

interface PhotoManagementProps {
  photos: (UserPhoto | PendingPhoto)[];
  onPhotoChange: (operation: PhotoOperation) => void;
  error?: string | null;
}

export function PhotoManagement({ photos, onPhotoChange, error: externalError }: PhotoManagementProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files) return;
    
    setError(null);
    setIsProcessing(true);

    try {
      const validFiles: File[] = [];

      // Check if adding these would exceed limit
      if (photos.length + files.length > 3) {
        throw new Error("Maximum of 3 photos allowed.");
      }

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

        validFiles.push(file);
      }

      if (validFiles.length > 0) {
        onPhotoChange({ type: 'add', files: validFiles });
      }

      if (inputRef.current) inputRef.current.value = "";
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsProcessing(false);
    }
  }, [photos.length, onPhotoChange]);

  const handleDeletePhoto = useCallback((photoId: string, storagePath: string | null) => {
    setError(null);
    onPhotoChange({ type: 'delete', photoId, storagePath });
  }, [onPhotoChange]);

  const handleReorder = useCallback((fromIndex: number, toIndex: number) => {
    setError(null);
    
    const sortedPhotos = [...photos].sort((a, b) => a.display_order - b.display_order);
    const [movedPhoto] = sortedPhotos.splice(fromIndex, 1);
    sortedPhotos.splice(toIndex, 0, movedPhoto);
    
    // Update display_order and is_primary
    const reorderedPhotos = sortedPhotos.map((photo, index) => ({
      ...photo,
      display_order: index,
      is_primary: index === 0,
    }));
    
    onPhotoChange({ type: 'reorder', photos: reorderedPhotos });
  }, [photos, onPhotoChange]);

  const sortedPhotos = [...photos].sort((a, b) => a.display_order - b.display_order);

  const { handleDragStart, handleDragOver, handleDragLeave, handleDragEnd, getDragClassName } =
    useDragReorder(sortedPhotos, handleReorder);

  const displayError = externalError || error;

  return (
    <div className="space-y-4">
      {/* Status Messages */}
      {displayError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{displayError}</p>
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
          disabled={isProcessing || sortedPhotos.length >= 3}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isProcessing || sortedPhotos.length >= 3}
          className="px-4 py-2 text-sm font-medium rounded border border-gray-300 bg-white hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Choose Files
        </button>
        <span className="text-xs text-gray-600">
          {3 - sortedPhotos.length} remaining (max 3, 2MB each)
        </span>
      </div>
      {isProcessing && (
        <p className="text-sm text-blue-600">Processing photos...</p>
      )}

      {/* Photos Grid with Drag & Drop */}
      {sortedPhotos.length > 0 ? (
        <div>
          <p className="text-xs text-gray-600 mb-2">Drag to reorder • First photo is your primary photo</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {sortedPhotos.map((photo, index) => {
              const isPending = 'file' in photo;
              const photoUrl = isPending ? photo.preview_url : (photo as UserPhoto).photo_url;
              const storagePath = isPending ? null : ((photo as UserPhoto).storage_path || null);
              
              return (
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
                    {isPending ? (
                      // Pending photos use blob URLs which can't use Next.js Image
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photoUrl}
                        alt={photo.is_primary ? "Primary photo" : "Profile photo"}
                        className="w-full h-full object-cover pointer-events-none"
                      />
                    ) : (
                      // Existing photos from CloudFront use optimized Next.js Image
                      <Image
                        src={photoUrl}
                        alt={photo.is_primary ? "Primary photo" : "Profile photo"}
                        fill
                        className="object-cover pointer-events-none"
                        sizes="(max-width: 640px) 100vw, 33vw"
                      />
                    )}
                    {photo.is_primary && (
                      <div className="absolute top-2 left-2 bg-black text-white px-2 py-1 rounded text-xs font-medium z-10">
                        ★ Primary
                      </div>
                    )}
                    {isPending && (
                      <div className="absolute top-2 left-2 bg-orange-600 text-white px-2 py-1 rounded text-xs font-medium z-10">
                        New
                      </div>
                    )}
                    <button
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-700 shadow-md font-bold"
                      onClick={() => handleDeletePhoto(photo.id, storagePath)}
                      aria-label="Remove photo"
                      title="Remove photo"
                      style={{ color: '#ffffff' }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
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
