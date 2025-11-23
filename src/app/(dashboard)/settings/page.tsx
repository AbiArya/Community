"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { AccountSettings } from "@/components/settings/AccountSettings";
import { MatchingPreferences } from "@/components/settings/MatchingPreferences";
import { AccountDeletion } from "@/components/settings/AccountDeletion";
import { ProfileDataProvider } from "@/hooks/useProfileData";

export default function SettingsPage() {
  return (
    <AuthGuard>
      <ProfileDataProvider>
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
      </ProfileDataProvider>
    </AuthGuard>
  );
}
