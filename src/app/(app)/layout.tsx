import type { ReactNode } from "react";

/** Shell layout is extended in the authenticated shell story; group keeps URLs without segment prefix. */
export default function AppRouteGroupLayout({ children }: { children: ReactNode }) {
  return children;
}
