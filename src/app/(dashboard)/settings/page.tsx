"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { AccountSettings } from "@/components/settings/AccountSettings";
import { MatchingPreferences } from "@/components/settings/MatchingPreferences";
import { AccountDeletion } from "@/components/settings/AccountDeletion";

export default function SettingsPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-4xl px-4">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-gray-600 mb-8">Manage your account and matching preferences</p>
          
          <div className="space-y-6">
            {/* Account Settings Section */}
            <section className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
              <AccountSettings />
            </section>

            {/* Matching Preferences Section */}
            <section className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">Matching Preferences</h2>
              <MatchingPreferences />
            </section>

            {/* Account Deletion Section */}
            <section className="bg-white rounded-lg shadow-sm border p-6 border-red-200">
              <h2 className="text-xl font-semibold mb-4 text-red-600">Danger Zone</h2>
              <AccountDeletion />
            </section>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
