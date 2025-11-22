"use client";

import { useState } from "react";
import { isValidZipcode, zipcodeToLocation } from "@/lib/utils/zipcode";

interface Preferences {
  zipcode: string;
  ageMin: number;
  ageMax: number;
  distanceMiles: number;
}

interface PreferencesStepState {
  zipcode: string;
  ageMin: string;
  ageMax: string;
  distanceMiles: string;
}

interface PreferencesStepProps {
  value: Preferences;
  onChange: (next: Preferences) => void;
}

export function PreferencesStep({ value, onChange }: PreferencesStepProps) {
  const [localState, setLocalState] = useState<PreferencesStepState>({
    zipcode: value.zipcode || "",
    ageMin: value.ageMin.toString(),
    ageMax: value.ageMax.toString(),
    distanceMiles: value.distanceMiles.toString(),
  });
  const [zipcodeError, setZipcodeError] = useState<string>("");
  const [locationDisplay, setLocationDisplay] = useState<string>("");

  function updateLocal<K extends keyof PreferencesStepState>(key: K, v: PreferencesStepState[K]) {
    setLocalState(prev => ({ ...prev, [key]: v }));
    
    // Clear zipcode error when user types
    if (key === "zipcode") {
      setZipcodeError("");
      setLocationDisplay("");
    }
  }

  function validateZipcode() {
    const zip = localState.zipcode.trim();
    if (!zip) {
      setZipcodeError("Zipcode is required");
      setLocationDisplay("");
      return false;
    }
    
    if (!isValidZipcode(zip)) {
      setZipcodeError("Please enter a valid US zipcode");
      setLocationDisplay("");
      return false;
    }
    
    // Show location for valid zipcode
    const location = zipcodeToLocation(zip);
    if (location) {
      setLocationDisplay(location);
    }
    
    setZipcodeError("");
    return true;
  }

  function syncToParent() {
    const isZipcodeValid = validateZipcode();
    
    const newValue = {
      zipcode: localState.zipcode.trim(),
      ageMin: Math.max(18, Math.min(100, Number(localState.ageMin) || 18)),
      ageMax: Math.max(18, Math.min(100, Number(localState.ageMax) || 100)),
      distanceMiles: Math.max(1, Math.min(200, Number(localState.distanceMiles) || 1)),
    };
    
    // Only update parent if zipcode is valid
    if (isZipcodeValid) {
      onChange(newValue);
    }
  }

  return (
    <div className="space-y-4">
      <p className="font-medium text-gray-900">Location & Preferences</p>
      <p className="text-sm text-gray-600">
        We use your zipcode for distance-based matching, similar to apps like Hinge.
      </p>
      
      <div className="space-y-4">
        {/* Zipcode field - prominent placement */}
        <label className="text-sm space-y-1 block">
          <span className="font-medium">Zipcode <span className="text-red-500">*</span></span>
          <input
            type="text"
            value={localState.zipcode}
            onChange={(e) => {
              updateLocal("zipcode", e.target.value);
            }}
            onBlur={() => {
              validateZipcode();
              syncToParent();
            }}
            placeholder="e.g., 94102"
            className={`w-full border rounded px-3 py-2 bg-white focus:outline-none ${zipcodeError ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-gray-500'}`}
            maxLength={10}
            autoComplete="postal-code"
          />
          {zipcodeError && (
            <span className="text-xs text-red-600">{zipcodeError}</span>
          )}
          {locationDisplay && !zipcodeError && (
            <span className="text-xs text-green-600">✓ {locationDisplay}</span>
          )}
        </label>

        {/* Matching preferences */}
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="text-sm space-y-1">
            <span className="text-gray-700">Age range min</span>
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
              className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:border-gray-500 focus:outline-none"
              autoComplete="off"
            />
          </label>
          <label className="text-sm space-y-1">
            <span className="text-gray-700">Age range max</span>
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
              className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:border-gray-500 focus:outline-none"
              autoComplete="off"
            />
          </label>
          <label className="text-sm space-y-1">
            <span className="text-gray-700">Distance radius (miles)</span>
            <input
              type="number"
              value={localState.distanceMiles}
              min={1}
              max={200}
              onChange={(e) => {
                updateLocal("distanceMiles", e.target.value);
              }}
              onBlur={() => {
                syncToParent();
              }}
              className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:border-gray-500 focus:outline-none"
              autoComplete="off"
            />
          </label>
        </div>
      </div>
    </div>
  );
}