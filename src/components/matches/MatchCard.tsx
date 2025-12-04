"use client";

import { useState } from "react";
import type { Match } from "@/hooks/useMatches";

interface MatchCardProps {
  match: Match;
}

export function MatchCard({ match }: MatchCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const user = match.matched_user;
  if (!user) return null;

  const photos = [...(user.photos || [])].sort((a, b) => a.display_order - b.display_order);
  const primaryPhoto = photos.find(p => p.is_primary) || photos[0];
  const currentPhoto = photos[currentPhotoIndex] || primaryPhoto;
  
  const sortedHobbies = [...(user.hobbies || [])]
    .sort((a, b) => a.preference_rank - b.preference_rank)
    .slice(0, 6);

  const compatibilityPercent = Math.round((match.similarity_score || 0) * 100);

  const nextPhoto = () => {
    if (photos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
    }
  };

  const prevPhoto = () => {
    if (photos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
    }
  };

  return (
    <div 
      className={`group relative overflow-hidden rounded-3xl bg-white border border-white/60 shadow-[0_20px_60px_-20px_rgba(17,20,35,0.25)] transition-all duration-500 ${
        isExpanded ? 'col-span-full md:col-span-2 row-span-2' : ''
      }`}
    >
      {/* Compatibility badge */}
      <div className="absolute top-4 right-4 z-20">
        <div className="flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm px-3 py-1.5 shadow-lg">
          <svg className="h-4 w-4 text-brand-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-bold text-ink-900">{compatibilityPercent}%</span>
        </div>
      </div>

      {/* Photo section */}
      <div className={`relative ${isExpanded ? 'aspect-[16/10]' : 'aspect-[4/5]'}`}>
        {currentPhoto ? (
          <>
            <img
              src={currentPhoto.photo_url}
              alt={`${user.full_name}'s profile`}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            
            {/* Photo navigation */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white/30"
                  aria-label="Previous photo"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white/30"
                  aria-label="Next photo"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                
                {/* Photo indicators */}
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {photos.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => { e.stopPropagation(); setCurrentPhotoIndex(idx); }}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === currentPhotoIndex 
                          ? 'w-6 bg-white' 
                          : 'w-1.5 bg-white/50 hover:bg-white/70'
                      }`}
                      aria-label={`View photo ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-brand-100 to-peach-100 flex items-center justify-center">
            <div className="text-center text-ink-400">
              <div className="mx-auto mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-white/50">
                <svg className="h-10 w-10" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm">No photo</p>
            </div>
          </div>
        )}

        {/* Name and basic info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
          <h3 className="font-heading text-2xl font-bold tracking-tight">
            {user.full_name}
            {user.age && <span className="ml-2 font-normal opacity-90">{user.age}</span>}
          </h3>
          {user.location && (
            <p className="mt-1 flex items-center gap-1 text-sm text-white/80">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {user.location}
            </p>
          )}
        </div>
      </div>

      {/* Content section */}
      <div className="p-5 space-y-4">
        {/* Hobbies */}
        {sortedHobbies.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {sortedHobbies.map((userHobby, index) => (
              <span
                key={userHobby.id}
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                  index < 3 
                    ? 'bg-gradient-to-r from-brand-50 to-peach-50 text-brand-700 ring-1 ring-brand-200/50' 
                    : 'bg-sand-100 text-ink-700'
                }`}
              >
                {userHobby.hobby?.name}
              </span>
            ))}
            {(user.hobbies?.length || 0) > 6 && (
              <span className="inline-flex items-center rounded-full bg-ink-100 px-3 py-1 text-xs font-medium text-ink-600">
                +{(user.hobbies?.length || 0) - 6} more
              </span>
            )}
          </div>
        )}

        {/* Bio preview / expanded bio */}
        {user.bio && (
          <div>
            <p className={`text-sm text-ink-600 leading-relaxed ${!isExpanded ? 'line-clamp-2' : ''}`}>
              {user.bio}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-ink-50 px-4 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-ink-100"
          >
            {isExpanded ? (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Close
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View Profile
              </>
            )}
          </button>
          <button
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(124,58,237,0.5)] transition hover:from-brand-600 hover:to-brand-700 hover:-translate-y-0.5"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Message
          </button>
        </div>
      </div>

      {/* Expanded view - additional photos grid */}
      {isExpanded && photos.length > 1 && (
        <div className="border-t border-ink-100 p-5">
          <h4 className="mb-3 text-sm font-semibold text-ink-700">More Photos</h4>
          <div className="grid grid-cols-3 gap-2">
            {photos.slice(0, 6).map((photo, idx) => (
              <button
                key={photo.id}
                onClick={() => setCurrentPhotoIndex(idx)}
                className={`aspect-square overflow-hidden rounded-xl transition-all ${
                  idx === currentPhotoIndex 
                    ? 'ring-2 ring-brand-500 ring-offset-2' 
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={photo.photo_url}
                  alt={`Photo ${idx + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

