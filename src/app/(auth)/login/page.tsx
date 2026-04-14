import { LoginForm } from "@/components/auth/login-form";
import { Suspense } from "react";

export default function LoginPage() {
  // Next.js requires a suspense boundary when using useSearchParams in children.
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
