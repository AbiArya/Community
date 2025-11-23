"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { Suspense } from "react";
import { ProfileWizard } from "@/components/profile/ProfileWizard";

export default function ProfileSetupPage() {
  return (
    <Suspense>
      <AuthGuard>
        <main className="mx-auto w-full max-w-3xl space-y-6 p-6">
          <div className="card-elevated space-y-6 p-6">
            <div className="space-y-2">
              <span className="eyebrow-pill border border-brand-200 bg-brand-50/70 text-brand-700">
                Getting started
              </span>
              <h1 className="font-heading text-2xl text-ink-900">Set up your profile</h1>
              <p className="text-sm text-ink-600">
                Complete your profile to start connecting with people who share your interests
              </p>
            </div>
            <ProfileWizard />
          </div>
        </main>
      </AuthGuard>
    </Suspense>
  );
}


