"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { Suspense } from "react";
import { ProfileWizard } from "@/components/profile/ProfileWizard";

export default function ProfileSetupPage() {
  return (
    <Suspense>
      <AuthGuard>
        <main className="mx-auto max-w-3xl w-full p-6 space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
            <h1 className="text-2xl font-semibold text-gray-900">Set up your profile</h1>
            <ProfileWizard />
          </div>
        </main>
      </AuthGuard>
    </Suspense>
  );
}


