"use client";

import { useCallback, useMemo, useRef, useState } from "react";

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

  function removePhoto(id: string) {
    const filtered = photos.filter((p) => p.id !== id);
    // Ensure one remains primary
    if (!filtered.some((p) => p.isPrimary) && filtered.length > 0) {
      filtered[0] = { ...filtered[0], isPrimary: true };
    }
    onChange(filtered);
  }

  function setPrimary(id: string) {
    onChange(photos.map((p) => ({ ...p, isPrimary: p.id === id })));
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
          className="block text-sm"
          aria-label="Upload photos"
        />
        <span className="text-xs text-black/70 dark:text-white/70">{remaining} remaining (max {maxPhotos})</span>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">{error}</p>
      )}

      {photos.length > 0 ? (
        <ul className="grid sm:grid-cols-3 gap-4">
          {photos.map((p) => (
            <li key={p.id} className="border rounded-lg overflow-hidden">
              <div className="aspect-square bg-gray-50 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="Uploaded" className="w-full h-full object-cover" />
              </div>
              <div className="p-2 flex items-center justify-between gap-2">
                <button
                  className={`px-2 py-1 text-xs rounded ${p.isPrimary ? "bg-black text-white" : "border"}`}
                  onClick={() => setPrimary(p.id)}
                  aria-pressed={p.isPrimary}
                >
                  {p.isPrimary ? "Primary" : "Make primary"}
                </button>
                <button
                  className="px-2 py-1 text-xs rounded border"
                  onClick={() => removePhoto(p.id)}
                  aria-label="Remove photo"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-black/70 dark:text-white/70">No photos added yet.</p>
      )}
    </div>
  );
}


