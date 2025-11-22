"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useDragReorder } from "@/hooks/useDragReorder";

export interface UploadedPhoto {
  id: string;
  file: File;
  url: string;
  isPrimary: boolean;
  sizeBytes: number;
  type: string;
}

interface PhotoUploadProps {
  photos: UploadedPhoto[];
  onChange: (nextPhotos: UploadedPhoto[]) => void;
  maxPhotos?: number;
}

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ACCEPT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

export function PhotoUpload({ photos, onChange, maxPhotos = 3 }: PhotoUploadProps) {
  const remaining = Math.max(0, maxPhotos - photos.length);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const acceptAttr = useMemo(() => "image/*,image/heic,image/heif", []);

  const addFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setError(null);
      const next: UploadedPhoto[] = [...photos];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (next.length >= maxPhotos) break;

        const isAcceptableType = ACCEPT_TYPES.includes(file.type) || file.type.startsWith("image/");
        if (!isAcceptableType) {
          setError("Unsupported file type. Please upload JPG, PNG, WEBP, or HEIC.");
          continue;
        }

        if (file.size > MAX_SIZE_BYTES) {
          setError("Each photo must be under 2MB.");
          continue;
        }

        const url = URL.createObjectURL(file);
        const photo: UploadedPhoto = {
          id: `${Date.now()}-${i}-${file.name}`,
          file,
          url,
          isPrimary: next.length === 0 ? true : false,
          sizeBytes: file.size,
          type: file.type,
        };
        next.push(photo);
      }
      onChange(next);
      if (inputRef.current) inputRef.current.value = "";
    },
    [photos, onChange, maxPhotos]
  );

  const handleReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      const newPhotos = [...photos];
      const [draggedPhoto] = newPhotos.splice(fromIndex, 1);
      newPhotos.splice(toIndex, 0, draggedPhoto);

      // Update primary status - first photo is always primary
      const updated = newPhotos.map((p, idx) => ({ ...p, isPrimary: idx === 0 }));
      onChange(updated);
    },
    [photos, onChange]
  );

  const { handleDragStart, handleDragOver, handleDragLeave, handleDragEnd, getDragClassName } =
    useDragReorder(photos, handleReorder);

  function removePhoto(id: string) {
    const filtered = photos.filter((p) => p.id !== id);
    // Update primary status - first photo is always primary
    const updated = filtered.map((p, idx) => ({ ...p, isPrimary: idx === 0 }));
    onChange(updated);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept={acceptAttr}
          multiple
          onChange={(e) => addFiles(e.currentTarget.files)}
          className="hidden"
          aria-label="Upload photos"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="px-4 py-2 text-sm font-medium rounded border border-gray-300 bg-white hover:bg-gray-50 cursor-pointer"
        >
          Choose Files
        </button>
        <span className="text-xs text-gray-600">{remaining} remaining (max {maxPhotos})</span>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">{error}</p>
      )}

      {photos.length > 0 ? (
        <div>
          <p className="text-xs text-gray-600 mb-2">Drag to reorder • First photo is your primary photo</p>
          <ul className="grid sm:grid-cols-3 gap-4">
            {photos.map((p, index) => (
              <li
                key={p.id}
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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={p.url} 
                    alt={p.isPrimary ? "Primary photo" : "Uploaded photo"} 
                    className="w-full h-full object-cover pointer-events-none" 
                  />
                  {p.isPrimary && (
                    <div className="absolute top-2 left-2 bg-black text-white px-2 py-1 rounded text-xs font-medium">
                      ★ Primary
                    </div>
                  )}
                  <button
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-700 shadow-md font-bold"
                    onClick={() => removePhoto(p.id)}
                    aria-label="Remove photo"
                    title="Remove photo"
                    style={{ color: '#ffffff' }}
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-gray-600">No photos added yet.</p>
      )}
    </div>
  );
}


