"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AccountSettings } from "@/components/settings/AccountSettings";
import { MatchingPreferences } from "@/components/settings/MatchingPreferences";
import { AccountDeletion } from "@/components/settings/AccountDeletion";
import { ProfileDataProvider, useProfileData } from "@/hooks/useProfileData";
import { SkeletonSettings } from "@/components/ui/Skeleton";

export default function SettingsPage() {
  return (
    <AuthGuard>
      <ProfileDataProvider>
        <SettingsPageContent />
      </ProfileDataProvider>
    </AuthGuard>
  );
}

function SettingsPageContent() {
  const router = useRouter();
  const { data: profile, isLoading, error } = useProfileData();

  useEffect(() => {
    if (isLoading) return;
    
    // If user is authenticated but has no profile record, redirect to setup
    if (!profile && error === "User not found") {
      router.replace("/profile/setup");
    }
  }, [isLoading, profile, error, router]);

  // Show loading while checking profile or redirecting
  if (isLoading || (!profile && error === "User not found")) {
    return (
      <div className="min-h-screen py-8">
        <div className="mx-auto max-w-4xl px-4">
          <SkeletonSettings />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-8 space-y-2">
          <h1 className="font-heading text-3xl text-ink-900">Settings</h1>
          <p className="text-ink-600">Manage your account and matching preferences</p>
        </div>
        
        <div className="space-y-6">
          {/* Account Settings Section */}
          <section className="card-elevated p-6">
            <h2 className="mb-4 text-xl font-semibold text-ink-900">Account Settings</h2>
            <AccountSettings />
          </section>

          {/* Matching Preferences Section */}
          <section className="card-elevated p-6">
            <h2 className="mb-4 text-xl font-semibold text-ink-900">Matching Preferences</h2>
            <MatchingPreferences />
          </section>

          {/* Account Deletion Section */}
          <section className="rounded-2xl border border-error-200 bg-error-50/60 p-6">
            <h2 className="mb-4 text-xl font-semibold text-error-600">Danger Zone</h2>
            <AccountDeletion />
          </section>
        </div>
      </div>
    </div>
  );
}
