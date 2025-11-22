"use client";

import { useMemo } from "react";

interface DescriptionStepProps {
  value: string;
  onChange: (next: string) => void;
  name: string;
  onNameChange: (next: string) => void;
  age: string;
  onAgeChange: (next: string) => void;
  maxLength?: number;
}

export function DescriptionStep({ value, onChange, name, onNameChange, age, onAgeChange, maxLength = 500 }: DescriptionStepProps) {
  const remaining = useMemo(() => Math.max(0, maxLength - (value?.length ?? 0)), [value, maxLength]);
  
  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string or valid numbers
    if (value === '' || (!isNaN(Number(value)) && Number(value) >= 0)) {
      onAgeChange(value);
    }
  };
  
  return (
    <div className="space-y-3">
      <p className="font-medium text-gray-900">About you</p>
      <p className="text-sm text-gray-600">Tell us about yourself.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="full_name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:border-gray-500 focus:outline-none"
            placeholder="Enter your full name"
            autoComplete="name"
            required
          />
        </div>
        
        <div>
          <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
            Age
          </label>
          <input
            type="number"
            id="age"
            value={age}
            onChange={handleAgeChange}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:border-gray-500 focus:outline-none"
            placeholder="Enter your age"
            min="18"
            max="100"
            autoComplete="off"
          />
        </div>
      </div>
      
      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
          Bio
        </label>
        <textarea
          id="bio"
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm min-h-32 bg-white focus:border-gray-500 focus:outline-none"
          placeholder="I love weekend hikes and board games. Looking to meet people for..."
          aria-describedby="bio-counter"
          autoComplete="off"
        />
        <div id="bio-counter" className="text-xs text-gray-500">{remaining} characters left</div>
      </div>
    </div>
  );
}


