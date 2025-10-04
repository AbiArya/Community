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
          className="w-full border rounded px-3 py-2 text-sm"
          aria-label="Search hobbies"
          autoComplete="off"
        />
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <p className="text-xs uppercase tracking-wide mb-2">Results</p>
          <ul className="grid sm:grid-cols-2 gap-2">
            {filtered.map((hobby) => (
              <li key={hobby.id}>
                <button
                  className="w-full border rounded px-2 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
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
          <p className="text-xs uppercase tracking-wide mb-2">Selected (ranked)</p>
          {selected.length === 0 ? (
            <p className="text-sm text-black/70 dark:text-white/70">No hobbies selected yet.</p>
          ) : (
            <ul className="space-y-2">
              {selected
                .slice()
                .sort((a, b) => a.rank - b.rank)
                .map((h) => (
                  <li key={h.id} className="border rounded p-2 text-sm flex items-center justify-between gap-2">
                    <span>{h.rank}. {h.name}</span>
                    <div className="flex items-center gap-1">
                      <button className="border rounded px-2 py-1 text-xs" onClick={() => move(h.id, -1)} aria-label="Move up">↑</button>
                      <button className="border rounded px-2 py-1 text-xs" onClick={() => move(h.id, 1)} aria-label="Move down">↓</button>
                      <button className="border rounded px-2 py-1 text-xs" onClick={() => removeHobby(h.id)} aria-label="Remove">Remove</button>
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


