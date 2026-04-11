"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerRequest } from "@/lib/auth/auth-api";

export function RegisterForm() {
  const router = useRouter();
  const emailId = useId();
  const passwordId = useId();
  const errorId = useId();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await registerRequest(email, password);
      await router.refresh();
      router.push("/factures");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Inscription impossible.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={onSubmit} noValidate>
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Inscription</h1>
        <p className="text-sm text-muted-foreground">
          Créez un compte avec votre e-mail et un mot de passe sécurisé (8 caractères minimum).
        </p>
      </div>

      {error ? (
        <Alert variant="destructive" id={errorId} role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor={emailId}>Adresse e-mail</Label>
          <Input
            id={emailId}
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={passwordId}>Mot de passe</Label>
          <Input
            id={passwordId}
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
          />
          <p className="text-xs text-muted-foreground">Au moins 8 caractères.</p>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Création du compte…" : "Créer mon compte"}
      </Button>

      <div className="text-center">
        <Button asChild variant="link">
          <Link href="/login">Déjà un compte ? Connexion</Link>
        </Button>
      </div>
    </form>
  );
}
