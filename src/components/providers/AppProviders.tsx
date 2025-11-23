"use client";

import type { ReactNode } from "react";
import { AuthSessionProvider } from "@/hooks/useAuthSession";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return <AuthSessionProvider>{children}</AuthSessionProvider>;
}


