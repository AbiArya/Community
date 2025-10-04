"use client";

import { useMemo } from "react";

interface DescriptionStepProps {
  value: string;
  onChange: (next: string) => void;
  maxLength?: number;
}

export function DescriptionStep({ value, onChange, maxLength = 500 }: DescriptionStepProps) {
  const remaining = useMemo(() => Math.max(0, maxLength - (value?.length ?? 0)), [value, maxLength]);
  return (
    <div className="space-y-3">
      <p className="font-medium">About you</p>
      <p className="text-sm text-black/70 dark:text-white/70">Write a short description to help others get to know you.</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        className="w-full border rounded px-3 py-2 text-sm min-h-32"
        placeholder="I love weekend hikes and board games. Looking to meet people for..."
        aria-describedby="bio-counter"
        autoComplete="off"
      />
      <div id="bio-counter" className="text-xs text-black/60 dark:text-white/60">{remaining} characters left</div>
    </div>
  );
}


