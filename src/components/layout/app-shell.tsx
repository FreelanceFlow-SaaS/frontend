"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { logoutRequest } from "@/lib/auth/auth-api";
import { clearAccessToken, getAccessTokenFromStorage } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Tableau de bord" },
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
    setMobileNavOpen(false);
    router.push("/login?loggedOut=1");
  }

  function closeMobileNav() {
    setMobileNavOpen(false);
  }

  const navContent = (
    <>
      <p className="mb-4 text-sm font-semibold tracking-tight text-foreground">FreelanceFlow</p>
      <ul className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, label }) => (
          <li key={href}>
            <Link
              href={href}
              onClick={closeMobileNav}
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
    </>
  );

  return (
    <div className="relative flex min-h-full flex-1">
      {mobileNavOpen ? (
        <div
          className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm md:hidden"
          onClick={closeMobileNav}
          aria-hidden="true"
        />
      ) : null}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col gap-1 border-r border-border bg-card p-4 transition-transform md:hidden",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Navigation mobile"
        aria-hidden={!mobileNavOpen}
      >
        <div className="mb-2 flex items-center justify-end">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={closeMobileNav}
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        {navContent}
      </aside>
      <nav
        id="navigation-app"
        aria-label="Navigation principale"
        className="hidden w-56 shrink-0 flex-col gap-1 border-r border-border bg-card p-4 md:flex"
      >
        {navContent}
      </nav>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-border bg-background px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <ThemeToggle />
          </div>
        </header>
        <main id="main" className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
