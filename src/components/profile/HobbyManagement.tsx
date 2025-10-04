"use client";

import { useState, useCallback, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useProfileData } from "@/hooks/useProfileData";

interface Hobby {
  id: string;
  name: string;
  category: string;
}

interface UserHobby {
  id: string;
  hobby_id: string;
  preference_rank: number;
  hobby: Hobby;
}

interface HobbyManagementProps {
  onUpdate?: () => void;
  onHobbiesChange?: (hobbies: UserHobby[]) => void;
}

export function HobbyManagement({ onUpdate, onHobbiesChange }: HobbyManagementProps) {
  const { session } = useAuthSession();
  const { data: profile } = useProfileData();
  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [localUserHobbies, setLocalUserHobbies] = useState<UserHobby[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all available hobbies
  const fetchHobbies = useCallback(async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('hobbies')
        .select('*')
        .order('name');

      if (error) {
        throw error;
      }

      setHobbies(data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize hobbies and local state
  useEffect(() => {
    fetchHobbies();
  }, [fetchHobbies]);

  // Initialize local user hobbies when profile loads
  useEffect(() => {
    if (profile?.hobbies) {
      setLocalUserHobbies([...profile.hobbies]);
    }
  }, [profile?.hobbies]);

  // Notify parent component of changes
  useEffect(() => {
    onHobbiesChange?.(localUserHobbies);
  }, [localUserHobbies, onHobbiesChange]);

  const filteredHobbies = hobbies.filter(hobby => 
    hobby.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !localUserHobbies.some(userHobby => userHobby.hobby_id === hobby.id)
  );

  const sortedUserHobbies = [...localUserHobbies].sort((a, b) => a.preference_rank - b.preference_rank);

  const addHobby = useCallback((hobby: Hobby) => {
    if (!session) return;
    
    const nextRank = sortedUserHobbies.length + 1;
    const newUserHobby: UserHobby = {
      id: `temp-${Date.now()}`, // Temporary ID for local state
      hobby_id: hobby.id,
      preference_rank: nextRank,
      hobby: hobby,
    };
    
    setLocalUserHobbies(prev => [...prev, newUserHobby]);
  }, [session, sortedUserHobbies.length]);

  const removeHobby = useCallback((userHobbyId: string) => {
    const remaining = localUserHobbies.filter(h => h.id !== userHobbyId);
    // Re-rank remaining hobbies
    const reranked = remaining.map((h, i) => ({ ...h, preference_rank: i + 1 }));
    setLocalUserHobbies(reranked);
  }, [localUserHobbies]);

  const moveHobby = useCallback((fromIndex: number, toIndex: number) => {
    const hobbies = [...sortedUserHobbies];
    
    // Reorder the array
    const [movedHobby] = hobbies.splice(fromIndex, 1);
    hobbies.splice(toIndex, 0, movedHobby);
    
    // Update preference_rank for all hobbies
    const reranked = hobbies.map((h, i) => ({ ...h, preference_rank: i + 1 }));
    setLocalUserHobbies(reranked);
  }, [sortedUserHobbies]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="grid grid-cols-2 gap-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-8 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Available Hobbies */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Add Hobbies</h3>
          <div className="space-y-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hobbies..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <div className="max-h-64 overflow-y-auto">
            <div className="grid grid-cols-1 gap-2">
              {filteredHobbies.map((hobby) => (
                <button
                  key={hobby.id}
                  className="w-full text-left p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                  onClick={() => addHobby(hobby)}
                >
                  <div className="font-medium">{hobby.name}</div>
                  <div className="text-sm text-gray-500">{hobby.category}</div>
                </button>
              ))}
            </div>
            {filteredHobbies.length === 0 && searchQuery && (
              <p className="text-sm text-gray-500 text-center py-4">
                No hobbies found matching &ldquo;{searchQuery}&rdquo;
              </p>
            )}
          </div>
        </div>

        {/* Selected Hobbies */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Your Hobbies (Ranked)</h3>
          {sortedUserHobbies.length === 0 ? (
            <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
              <p className="text-gray-500">No hobbies selected yet</p>
              <p className="text-sm text-gray-400 mt-1">Add hobbies from the left panel</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedUserHobbies.map((userHobby, index) => (
                <div
                  key={userHobby.id}
                  className="flex items-center justify-between p-3 border border-gray-300 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <div>
                      <div className="font-medium">{userHobby.hobby.name}</div>
                      <div className="text-sm text-gray-500">{userHobby.hobby.category}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Reorder buttons */}
                    <button
                      className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
                      onClick={() => moveHobby(index, index - 1)}
                      disabled={index === 0}
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
                      onClick={() => moveHobby(index, index + 1)}
                      disabled={index === sortedUserHobbies.length - 1}
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button
                      className="px-2 py-1 text-xs rounded border border-red-300 text-red-600 hover:bg-red-50"
                      onClick={() => removeHobby(userHobby.id)}
                      title="Remove hobby"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
