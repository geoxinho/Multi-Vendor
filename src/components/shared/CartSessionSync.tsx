"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/store/cartStore";

/**
 * Invisible component that lives inside SessionProvider.
 * Clears the cart whenever the logged-in user changes
 * (logout → null, or different account login).
 */
export function CartSessionSync() {
  const { data: session, status } = useSession();
  const clearCart = useCartStore((s) => s.clearCart);
  const prevUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (status === "loading") return; // wait for session to resolve

    const currentUserId = session?.user?.id ?? null;

    // Skip the very first render (prevUserId is undefined)
    if (prevUserId.current !== undefined && prevUserId.current !== currentUserId) {
      clearCart();
    }

    prevUserId.current = currentUserId;
  }, [session?.user?.id, status, clearCart]);

  return null;
}
