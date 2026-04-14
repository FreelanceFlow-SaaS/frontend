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

type AddressFields = {
  addressLine: string;
  zipCode: string;
  city: string;
  country: string;
};

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

  function field(name: keyof ClientPayload, label: string, inputType = "text") {
    const id = `${formPrefix}-${name}`;
    return (
      <div className="grid gap-2" key={name}>
        <Label htmlFor={id}>{label}</Label>
        <Input
          id={id}
          name={name}
          type={inputType}
          value={values[name]}
          onChange={(e) => setValues((v) => ({ ...v, [name]: e.target.value }))}
          disabled={saving || loading}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
        />
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const token = getAccessTokenFromStorage();
    if (!token) {
      setError("Session expirée. Reconnectez-vous.");
      return;
    }
    const trimmed: ClientPayload = {
      name: values.name.trim(),
      email: values.email.trim(),
      company: values.company.trim(),
      address: formatAddress(address),
    };
    if (!trimmed.name || !trimmed.email || !trimmed.company) {
      setError("Remplissez tous les champs obligatoires.");
      return;
    }
    if (
      !address.addressLine.trim() ||
      !address.zipCode.trim() ||
      !address.city.trim() ||
      !address.country.trim()
    ) {
      setError("Renseignez une adresse complète (adresse, code postal, ville, pays).");
      return;
    }
    const countryIso = address.country.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(countryIso)) {
      setError("Pays : indiquez un code ISO à 2 lettres (ex. FR).");
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
      setError(err instanceof Error ? err.message : "Enregistrement impossible.");
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
                onChange={(e) => setAddress((a) => ({ ...a, addressLine: e.target.value }))}
                disabled={saving || loading}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${formPrefix}-zipCode`}>Code postal</Label>
              <Input
                id={`${formPrefix}-zipCode`}
                value={address.zipCode}
                onChange={(e) => setAddress((a) => ({ ...a, zipCode: e.target.value }))}
                disabled={saving || loading}
                inputMode="numeric"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${formPrefix}-city`}>Ville</Label>
              <Input
                id={`${formPrefix}-city`}
                value={address.city}
                onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
                disabled={saving || loading}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
              />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor={`${formPrefix}-country`}>Pays (code ISO, ex:FR)</Label>
              <Input
                id={`${formPrefix}-country`}
                value={address.country}
                onChange={(e) =>
                  setAddress((a) => ({ ...a, country: e.target.value.toUpperCase() }))
                }
                disabled={saving || loading}
                placeholder="FR"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
              />
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
