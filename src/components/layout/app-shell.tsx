"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import { logoutRequest } from "@/lib/auth/auth-api";
import { clearAccessToken, getAccessTokenFromStorage } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/factures", label: "Factures" },
  { href: "/clients", label: "Clients" },
  { href: "/prestations", label: "Prestations" },
  { href: "/profil-vendeur", label: "Profil vendeur" },
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const token = getAccessTokenFromStorage();
    if (token) {
      try {
        await logoutRequest(token);
      } catch {
        /* still clear client session */
      }
    }
    clearAccessToken();
    await router.refresh();
    router.push("/login");
  }

  return (
    <div className="flex min-h-full flex-1">
      <nav
        id="navigation-app"
        aria-label="Navigation principale"
        className="flex w-56 shrink-0 flex-col gap-1 border-r border-border bg-card p-4"
      >
        <p className="mb-4 text-sm font-semibold tracking-tight text-foreground">FreelanceFlow</p>
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex min-h-11 items-center rounded-md px-3 py-2 text-sm font-medium text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isActive(pathname, href) && "bg-muted",
                )}
                aria-current={isActive(pathname, href) ? "page" : undefined}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-auto pt-6">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => void handleSignOut()}
          >
            Déconnexion
          </Button>
        </div>
      </nav>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-border bg-background px-6 py-4">
          <ThemeSwitcher />
        </header>
        <main id="main" className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
