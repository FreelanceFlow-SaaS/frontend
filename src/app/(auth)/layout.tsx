import type { ReactNode } from "react";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 w-full max-w-md">
        <ThemeSwitcher />
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
