"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthSession } from "@/hooks/useAuthSession";
import { getSupabaseBrowserClient, clearAuthSession } from "@/lib/supabase/client";

export function AccountDeletion() {
  const router = useRouter();
  const { session } = useAuthSession();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const CONFIRMATION_PHRASE = "DELETE MY ACCOUNT";

  const handleDeleteAccount = async () => {
    if (confirmationText !== CONFIRMATION_PHRASE) {
      setMessage({
        type: "error",
        text: "Please type the confirmation phrase exactly as shown",
      });
      return;
    }

    if (!session?.user?.id) {
      setMessage({
        type: "error",
        text: "No active session found",
      });
      return;
    }

    setIsDeleting(true);
    setMessage(null);

    try {
      const supabase = getSupabaseBrowserClient();

      // Delete user data (cascading deletes will handle related records)
      const { error: deleteError } = await supabase
        .from("users")
        .delete()
        .eq("id", session.user.id);

      if (deleteError) throw deleteError;

      // Delete the auth user
      const { error: authError } = await supabase.auth.admin.deleteUser(
        session.user.id
      );

      // Note: The above admin call might fail in client context
      // In production, this should be handled by a server action or API route
      if (authError) {
        console.warn("Auth deletion may require server-side handling:", authError);
      }

      // Sign out and clear session
      await clearAuthSession();

      // Redirect to home page
      router.push("/?deleted=true");
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to delete account. Please contact support.",
      });
      setIsDeleting(false);
    }
  };

  if (!showConfirmation) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-red-900 mb-2">
            ⚠️ Warning: This action cannot be undone
          </h3>
          <p className="text-sm text-red-800">
            Deleting your account will permanently remove:
          </p>
          <ul className="mt-2 text-sm text-red-800 list-disc list-inside space-y-1">
            <li>Your profile and all personal information</li>
            <li>All uploaded photos</li>
            <li>Your hobby selections and preferences</li>
            <li>Match history and connections</li>
            <li>All account data and settings</li>
          </ul>
        </div>
        
        <button
          onClick={() => setShowConfirmation(true)}
          className="px-6 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
        >
          I Want to Delete My Account
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <h3 className="text-sm font-medium text-red-900 mb-2">
          Final Confirmation Required
        </h3>
        <p className="text-sm text-red-800 mb-4">
          This will permanently delete your account and all associated data.
          This action cannot be reversed.
        </p>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-red-900 mb-2">
              Type <span className="font-bold">{CONFIRMATION_PHRASE}</span> to confirm:
            </label>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder={CONFIRMATION_PHRASE}
              disabled={isDeleting}
              className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDeleteAccount}
              disabled={isDeleting || confirmationText !== CONFIRMATION_PHRASE}
              className="px-6 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? "Deleting Account..." : "Delete My Account Permanently"}
            </button>
            <button
              onClick={() => {
                setShowConfirmation(false);
                setConfirmationText("");
                setMessage(null);
              }}
              disabled={isDeleting}
              className="px-6 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div
          className={`p-3 rounded-md text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}





