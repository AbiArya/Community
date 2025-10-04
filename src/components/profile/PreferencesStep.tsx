"use client";

import { useState } from "react";

interface Preferences {
  ageMin: number;
  ageMax: number;
  distanceKm: number;
}

interface PreferencesStepState {
  ageMin: string;
  ageMax: string;
  distanceKm: string;
}

interface PreferencesStepProps {
  value: Preferences;
  onChange: (next: Preferences) => void;
}

export function PreferencesStep({ value, onChange }: PreferencesStepProps) {
  const [localState, setLocalState] = useState<PreferencesStepState>({
    ageMin: value.ageMin.toString(),
    ageMax: value.ageMax.toString(),
    distanceKm: value.distanceKm.toString(),
  });

  function updateLocal<K extends keyof PreferencesStepState>(key: K, v: PreferencesStepState[K]) {
    setLocalState(prev => ({ ...prev, [key]: v }));
  }

  function syncToParent() {
    const newValue = {
      ageMin: Math.max(18, Math.min(100, Number(localState.ageMin) || 18)),
      ageMax: Math.max(18, Math.min(100, Number(localState.ageMax) || 100)),
      distanceKm: Math.max(1, Math.min(200, Number(localState.distanceKm) || 1)),
    };
    onChange(newValue);
  }

  return (
    <div className="space-y-4">
      <p className="font-medium">Preferences</p>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="text-sm space-y-1">
          <span>Age range min</span>
          <input
            type="number"
            value={localState.ageMin}
            min={18}
            max={100}
            onChange={(e) => {
              updateLocal("ageMin", e.target.value);
            }}
            onBlur={() => {
              syncToParent();
            }}
            className="w-full border rounded px-3 py-2"
            autoComplete="off"
          />
        </label>
        <label className="text-sm space-y-1">
          <span>Age range max</span>
          <input
            type="number"
            value={localState.ageMax}
            min={18}
            max={100}
            onChange={(e) => {
              updateLocal("ageMax", e.target.value);
            }}
            onBlur={() => {
              syncToParent();
            }}
            className="w-full border rounded px-3 py-2"
            autoComplete="off"
          />
        </label>
        <label className="text-sm space-y-1">
          <span>Distance radius (km)</span>
          <input
            type="number"
            value={localState.distanceKm}
            min={1}
            max={200}
            onChange={(e) => {
              updateLocal("distanceKm", e.target.value);
            }}
            onBlur={() => {
              syncToParent();
            }}
            className="w-full border rounded px-3 py-2"
            autoComplete="off"
          />
        </label>

      </div>
    </div>
  );
}