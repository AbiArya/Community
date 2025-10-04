"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProfileStatus } from "@/hooks/useProfileStatus";
import { ProfileView } from "@/components/profile/ProfileView";

export default function ProfilePage() {
  const router = useRouter();
  const { isLoading, isComplete } = useProfileStatus();

  useEffect(() => {
    if (isLoading) return;
    if (isComplete === false) {
      router.replace("/profile/setup");
    }
  }, [isLoading, isComplete, router]);

  return (
    <Suspense>
      <AuthGuard>
        <main className="mx-auto max-w-3xl w-full p-6 space-y-6">
          {isLoading || isComplete === false ? (
            <div className="space-y-4">
              <h1 className="text-2xl font-semibold">Your Profile</h1>
              <p className="text-black/70 dark:text-white/70">Checking profile status...</p>
            </div>
          ) : (
            <ProfileView />
          )}
        </main>
      </AuthGuard>
    </Suspense>
  );
}


