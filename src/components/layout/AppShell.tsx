"use client";

import type { ReactNode } from "react";
import { Navigation } from "@/components/layout/Navigation";
import { RouteTransition } from "@/components/layout/RouteTransition";
import { Footer } from "@/components/layout/Footer";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <>
      <Navigation />
      <RouteTransition>{children}</RouteTransition>
      <Footer />
    </>
  );
}


