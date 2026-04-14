"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient, fetchClient, updateClient, type ClientPayload } from "@/lib/api/clients-api";
import { getAccessTokenFromStorage } from "@/lib/auth/session";

type ClientFormProps = {
  mode: "create" | "edit";
  clientId?: string;
};

type ClientField = keyof ClientPayload;
type ClientFieldErrors = Partial<Record<ClientField, string>>;

const emptyPayload: ClientPayload = {
  name: "",
  email: "",
  company: "",
  address: "",
};

export function ClientForm({ mode, clientId }: ClientFormProps) {
  const router = useRouter();
  const formPrefix = useId();
  const errorId = `${formPrefix}-error`;

  const [values, setValues] = useState<ClientPayload>(emptyPayload);
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ClientFieldErrors>({});

  useEffect(() => {
    if (mode !== "edit" || !clientId) return;
    const token = getAccessTokenFromStorage();
    if (!token) {
      setError("Session expirée. Reconnectez-vous.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const c = await fetchClient(token, clientId);
        if (!cancelled) {
          setValues({
            name: c.name,
            email: c.email,
            company: c.company,
            address: c.address,
          });
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Chargement impossible.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, clientId]);

  function field(name: ClientField, label: string, inputType = "text") {
    const id = `${formPrefix}-${name}`;
    const fieldError = fieldErrors[name];
    const fieldErrorId = `${id}-error`;
    return (
      <div className="grid gap-2" key={name}>
        <Label htmlFor={id}>{label}</Label>
        <Input
          id={id}
          name={name}
          type={inputType}
          value={values[name]}
          onChange={(e) => {
            setValues((v) => ({ ...v, [name]: e.target.value }));
            if (fieldErrors[name]) {
              setFieldErrors((prev) => {
                const next = { ...prev };
                delete next[name];
                return next;
              });
            }
          }}
          disabled={saving || loading}
          aria-invalid={Boolean(fieldError)}
          aria-describedby={fieldError ? fieldErrorId : undefined}
        />
        {fieldError ? (
          <p id={fieldErrorId} className="text-sm text-destructive" role="alert">
            {fieldError}
          </p>
        ) : null}
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    const token = getAccessTokenFromStorage();
    if (!token) {
      setError("Session expirée. Reconnectez-vous.");
      return;
    }
    const trimmed: ClientPayload = {
      name: values.name.trim(),
      email: values.email.trim(),
      company: values.company.trim(),
      address: values.address.trim(),
    };
    const nextFieldErrors: ClientFieldErrors = {};
    if (!trimmed.name) nextFieldErrors.name = "Le nom est obligatoire.";
    if (!trimmed.email) {
      nextFieldErrors.email = "L'e-mail est obligatoire.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed.email)) {
      nextFieldErrors.email = "L'e-mail doit être une adresse valide.";
    }
    if (!trimmed.company) nextFieldErrors.company = "L'entreprise est obligatoire.";
    if (!trimmed.address) nextFieldErrors.address = "L'adresse est obligatoire.";
    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }
    setSaving(true);
    try {
      if (mode === "create") {
        await createClient(token, trimmed);
        await router.refresh();
        router.push("/clients?created=1");
      } else if (clientId) {
        await updateClient(token, clientId, trimmed);
        await router.refresh();
        router.push("/clients?updated=1");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Enregistrement impossible.";
      const lowered = message.toLowerCase();

      if (lowered.includes("email")) {
        setFieldErrors((prev) => ({
          ...prev,
          email: "L'e-mail doit être une adresse valide.",
        }));
        return;
      }

      // Keep global alert only for non-field/internal failures.
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="p-8 text-sm text-muted-foreground">Chargement du client…</p>;
  }

  const title = mode === "create" ? "Nouveau client" : "Modifier le client";
  const submitLabel =
    mode === "create"
      ? saving
        ? "Création…"
        : "Créer le client"
      : saving
        ? "Enregistrement…"
        : "Enregistrer";

  return (
    <div className="mx-auto max-w-lg p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Nom, e-mail, entreprise et adresse seront disponibles pour vos factures.
        </p>
      </div>

      {error ? (
        <Alert variant="destructive" id={errorId} className="mb-4" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <form className="space-y-4" onSubmit={(e) => void onSubmit(e)} noValidate>
        {field("name", "Nom")}
        {field("email", "E-mail", "email")}
        {field("company", "Entreprise")}
        {field("address", "Adresse complète")}

        <div className="flex flex-wrap gap-3 pt-2">
          <Button type="submit" disabled={saving}>
            {submitLabel}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/clients">Annuler</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
