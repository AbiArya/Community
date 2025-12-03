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
  const { data: profile, isLoading, error } = useProfileData();

  useEffect(() => {
    if (isLoading) return;
    
    // If user is authenticated but has no profile record, redirect to setup
    if (!profile && error === "User not found") {
      router.replace("/profile/setup");
      return;
    }
    
    // If profile exists but is incomplete, redirect to setup
    if (profile && profile.is_profile_complete === false) {
      router.replace("/profile/setup");
    }
  }, [isLoading, profile, error, router]);

  // Show loading state while checking or during redirect
  const shouldShowStatus =
    isLoading || 
    (profile?.is_profile_complete === false) ||
    (!profile && error === "User not found");

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


