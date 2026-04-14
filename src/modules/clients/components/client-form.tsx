"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient, fetchClient, updateClient, type ClientPayload } from "@/lib/api/clients-api";
import { getAccessTokenFromStorage, redirectToLogin } from "@/lib/auth/session";

type ClientFormProps = {
  mode: "create" | "edit";
  clientId?: string;
};

type AddressFields = {
  addressLine: string;
  zipCode: string;
  city: string;
  country: string;
};

type ClientField = keyof ClientPayload;
type AddressField = keyof AddressFields;
type FormFieldKey = ClientField | AddressField;
type FormFieldErrors = Partial<Record<FormFieldKey, string>>;

const emptyPayload: ClientPayload = {
  name: "",
  email: "",
  company: "",
  address: "",
};

function parseAddress(address: string): AddressFields {
  const raw = address.trim();
  if (!raw) return { addressLine: "", zipCode: "", city: "", country: "" };

  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // Expected format (recommended):
  // line1
  // zip city
  // country
  if (lines.length >= 3) {
    const addressLine = lines[0];
    const zipCity = lines[1];
    const country = lines.slice(2).join(" ");
    const m = zipCity.match(/^(\d{4,6})\s+(.+)$/);
    return {
      addressLine,
      zipCode: m?.[1] ?? "",
      city: m?.[2] ?? zipCity,
      country,
    };
  }

  // Fallback: try comma-separated "line, zip city, country"
  const parts = raw
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 3) {
    const [addressLine, zipCity, ...rest] = parts;
    const m = zipCity.match(/^(\d{4,6})\s+(.+)$/);
    return {
      addressLine,
      zipCode: m?.[1] ?? "",
      city: m?.[2] ?? zipCity,
      country: rest.join(", "),
    };
  }

  // Last resort: keep everything in address line.
  return { addressLine: raw, zipCode: "", city: "", country: "" };
}

function formatAddress(fields: AddressFields): string {
  const line1 = fields.addressLine.trim();
  const zip = fields.zipCode.trim();
  const city = fields.city.trim();
  const country = fields.country.trim().toUpperCase();
  return [line1, `${zip} ${city}`.trim(), country].filter(Boolean).join("\n");
}

export function ClientForm({ mode, clientId }: ClientFormProps) {
  const router = useRouter();
  const formPrefix = useId();
  const errorId = `${formPrefix}-error`;

  const [values, setValues] = useState<ClientPayload>(emptyPayload);
  const [address, setAddress] = useState<AddressFields>({
    addressLine: "",
    zipCode: "",
    city: "",
    country: "FR",
  });
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({});

  useEffect(() => {
    if (mode !== "edit" || !clientId) return;
    const token = getAccessTokenFromStorage();
    if (!token) {
      redirectToLogin();
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const c = await fetchClient(token, clientId);
        if (!cancelled) {
          const parsed = parseAddress(c.address);
          setValues({
            name: c.name,
            email: c.email,
            company: c.company,
            address: c.address,
          });
          setAddress({
            addressLine: parsed.addressLine,
            zipCode: parsed.zipCode,
            city: parsed.city,
            country: parsed.country || "FR",
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
      redirectToLogin();
      return;
    }
    const trimmed: ClientPayload = {
      name: values.name.trim(),
      email: values.email.trim(),
      company: values.company.trim(),
      address: formatAddress(address),
    };
    const nextFieldErrors: FormFieldErrors = {};
    if (!trimmed.name) nextFieldErrors.name = "Le nom est obligatoire.";
    if (!trimmed.email) {
      nextFieldErrors.email = "L'e-mail est obligatoire.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed.email)) {
      nextFieldErrors.email = "L'e-mail doit être une adresse valide.";
    }
    if (!trimmed.company) nextFieldErrors.company = "L'entreprise est obligatoire.";
    if (!address.addressLine.trim()) nextFieldErrors.addressLine = "L'adresse est obligatoire.";
    if (!address.zipCode.trim()) nextFieldErrors.zipCode = "Le code postal est obligatoire.";
    if (!address.city.trim()) nextFieldErrors.city = "La ville est obligatoire.";
    if (!address.country.trim()) {
      nextFieldErrors.country = "Le pays est obligatoire.";
    } else if (!/^[A-Z]{2}$/.test(address.country.trim().toUpperCase())) {
      nextFieldErrors.country = "Pays : indiquez un code ISO à 2 lettres (ex. FR).";
    }
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

        <div className="rounded-lg border border-border p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor={`${formPrefix}-addressLine`}>Adresse</Label>
              <Input
                id={`${formPrefix}-addressLine`}
                value={address.addressLine}
                onChange={(e) => {
                  setAddress((a) => ({ ...a, addressLine: e.target.value }));
                  if (fieldErrors.addressLine) {
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.addressLine;
                      return next;
                    });
                  }
                }}
                disabled={saving || loading}
                aria-invalid={Boolean(fieldErrors.addressLine)}
                aria-describedby={
                  fieldErrors.addressLine ? `${formPrefix}-addressLine-error` : undefined
                }
              />
              {fieldErrors.addressLine ? (
                <p
                  id={`${formPrefix}-addressLine-error`}
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {fieldErrors.addressLine}
                </p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${formPrefix}-zipCode`}>Code postal</Label>
              <Input
                id={`${formPrefix}-zipCode`}
                value={address.zipCode}
                onChange={(e) => {
                  setAddress((a) => ({ ...a, zipCode: e.target.value }));
                  if (fieldErrors.zipCode) {
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.zipCode;
                      return next;
                    });
                  }
                }}
                disabled={saving || loading}
                inputMode="numeric"
                aria-invalid={Boolean(fieldErrors.zipCode)}
                aria-describedby={fieldErrors.zipCode ? `${formPrefix}-zipCode-error` : undefined}
              />
              {fieldErrors.zipCode ? (
                <p
                  id={`${formPrefix}-zipCode-error`}
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {fieldErrors.zipCode}
                </p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${formPrefix}-city`}>Ville</Label>
              <Input
                id={`${formPrefix}-city`}
                value={address.city}
                onChange={(e) => {
                  setAddress((a) => ({ ...a, city: e.target.value }));
                  if (fieldErrors.city) {
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.city;
                      return next;
                    });
                  }
                }}
                disabled={saving || loading}
                aria-invalid={Boolean(fieldErrors.city)}
                aria-describedby={fieldErrors.city ? `${formPrefix}-city-error` : undefined}
              />
              {fieldErrors.city ? (
                <p
                  id={`${formPrefix}-city-error`}
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {fieldErrors.city}
                </p>
              ) : null}
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor={`${formPrefix}-country`}>Pays (code ISO, ex:FR)</Label>
              <Input
                id={`${formPrefix}-country`}
                value={address.country}
                onChange={(e) => {
                  setAddress((a) => ({ ...a, country: e.target.value.toUpperCase() }));
                  if (fieldErrors.country) {
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.country;
                      return next;
                    });
                  }
                }}
                disabled={saving || loading}
                placeholder="FR"
                aria-invalid={Boolean(fieldErrors.country)}
                aria-describedby={fieldErrors.country ? `${formPrefix}-country-error` : undefined}
              />
              {fieldErrors.country ? (
                <p
                  id={`${formPrefix}-country-error`}
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {fieldErrors.country}
                </p>
              ) : null}
            </div>
          </div>
        </div>

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
