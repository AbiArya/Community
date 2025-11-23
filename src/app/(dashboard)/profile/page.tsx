"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProfileView } from "@/components/profile/ProfileView";
import { ProfileDataProvider, useProfileData } from "@/hooks/useProfileData";

export default function ProfilePage() {
  return (
    <Suspense>
      <AuthGuard>
        <ProfileDataProvider>
          <ProfilePageContent />
        </ProfileDataProvider>
      </AuthGuard>
    </Suspense>
  );
}

function ProfilePageContent() {
  const router = useRouter();
  const { data: profile, isLoading } = useProfileData();

  useEffect(() => {
    if (isLoading || !profile) return;
    if (profile.is_profile_complete === false) {
      router.replace("/profile/setup");
    }
  }, [isLoading, profile, router]);

  const shouldShowStatus =
    isLoading || (profile?.is_profile_complete === false);

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 p-6">
      {shouldShowStatus ? (
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold text-ink-900">Your Profile</h1>
          <p className="text-ink-600">Checking profile status...</p>
        </div>
      ) : (
        <ProfileView />
      )}
    </main>
  );
}


