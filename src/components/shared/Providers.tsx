"use client";

import { SessionProvider } from "next-auth/react";
import { CartSessionSync } from "@/components/shared/CartSessionSync";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CartSessionSync />
      {children}
    </SessionProvider>
  );
}
