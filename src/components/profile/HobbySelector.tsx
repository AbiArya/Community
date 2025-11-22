"use client";

import { useMemo, useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export interface RankedHobby {
  id: string;
  name: string;
  rank: number; // 1..N lower is higher priority
}

interface Hobby {
  id: string;
  name: string;
  category: string;
}

interface HobbySelectorProps {
  selected: RankedHobby[];
  onChange: (next: RankedHobby[]) => void;
}

export function HobbySelector({ selected, onChange }: HobbySelectorProps) {
  const [query, setQuery] = useState("");
  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Fetch hobbies from database
  useEffect(() => {
    async function fetchHobbies() {
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
    }

    fetchHobbies();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return hobbies.filter((h) => h.name.toLowerCase().includes(q));
  }, [hobbies, query]);

  function addHobby(hobby: Hobby) {
    if (selected.some((h) => h.id === hobby.id)) return;
    const nextRank = selected.length + 1;
    onChange([...selected, { id: hobby.id, name: hobby.name, rank: nextRank }]);
  }

  function removeHobby(id: string) {
    const remaining = selected.filter((h) => h.id !== id);
    // re-rank sequentially
    onChange(remaining.map((h, i) => ({ ...h, rank: i + 1 })));
  }

  function move(id: string, direction: -1 | 1) {
    const idx = selected.findIndex((h) => h.id === id);
    if (idx < 0) return;
    const target = idx + direction;
    if (target < 0 || target >= selected.length) return;
    const copy = [...selected];
    const [item] = copy.splice(idx, 1);
    copy.splice(target, 0, item);
    onChange(copy.map((h, i) => ({ ...h, rank: i + 1 })));
  }

  function handleDragStart(e: React.DragEvent, id: string) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  }

  function handleDragEnd() {
    setDragOverId(null);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDragEnter(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    setDragOverId(targetId);
  }

  function handleDragLeave(e: React.DragEvent) {
    // Only clear if we're leaving the item entirely (not entering a child)
    if (e.currentTarget === e.target) {
      setDragOverId(null);
    }
  }

  function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    setDragOverId(null);
    const draggedId = e.dataTransfer.getData("text/plain");
    if (draggedId === targetId) return;

    const draggedIdx = selected.findIndex((h) => h.id === draggedId);
    const targetIdx = selected.findIndex((h) => h.id === targetId);
    if (draggedIdx < 0 || targetIdx < 0) return;

    const copy = [...selected];
    const [item] = copy.splice(draggedIdx, 1);
    copy.splice(targetIdx, 0, item);
    onChange(copy.map((h, i) => ({ ...h, rank: i + 1 })));
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="grid sm:grid-cols-2 gap-2">
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

  if (error) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">Error loading hobbies: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search hobbies"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:border-gray-500 focus:outline-none"
          aria-label="Search hobbies"
          autoComplete="off"
        />
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <p className="text-xs uppercase tracking-wide mb-2 text-gray-700">Results</p>
          <ul className="grid sm:grid-cols-2 gap-2">
            {filtered.map((hobby) => (
              <li key={hobby.id}>
                <button
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => addHobby(hobby)}
                  disabled={selected.some((h) => h.id === hobby.id)}
                >
                  {hobby.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide mb-2 text-gray-700">Selected (ranked)</p>
          {selected.length === 0 ? (
            <p className="text-sm text-gray-600">No hobbies selected yet.</p>
          ) : (
            <ul className="space-y-2">
              {selected
                .slice()
                .sort((a, b) => a.rank - b.rank)
                .map((h) => (
                  <li key={h.id} className="relative">
                    {/* Drop indicator */}
                    {dragOverId === h.id && (
                      <div className="absolute -top-1 left-0 right-0 h-0.5 bg-gray-400 z-10" />
                    )}
                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, h.id)}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleDragOver}
                      onDragEnter={(e) => handleDragEnter(e, h.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, h.id)}
                      className="border border-gray-300 bg-white rounded p-2 text-sm relative cursor-move hover:border-gray-400 transition-colors"
                    >
                      <button 
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold leading-none transition-colors shadow-sm"
                        onClick={() => removeHobby(h.id)} 
                        aria-label="Remove"
                        title="Remove"
                      >
                        ×
                      </button>
                      <span className="text-gray-900 block pr-4">{h.rank}. {h.name}</span>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}


