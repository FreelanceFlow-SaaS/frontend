"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  fetchSellerProfile,
  patchSellerProfile,
  type FreelancerProfileDto,
} from "@/lib/api/profile-api";
import { getAccessTokenFromStorage, redirectToLogin } from "@/lib/auth/session";

function emptyForm(): FreelancerProfileDto {
  return {
    displayName: "",
    legalName: "",
    companyName: "",
    addressLine1: "",
    addressLine2: "",
    postalCode: "",
    city: "",
    country: "FR",
    vatNumber: "",
    siret: "",
  };
}

function fromProfile(p: FreelancerProfileDto | null): FreelancerProfileDto {
  if (!p) return emptyForm();
  return {
    displayName: p.displayName ?? "",
    legalName: p.legalName ?? "",
    companyName: p.companyName ?? "",
    addressLine1: p.addressLine1 ?? "",
    addressLine2: p.addressLine2 ?? "",
    postalCode: p.postalCode ?? "",
    city: p.city ?? "",
    country: p.country ?? "FR",
    vatNumber: p.vatNumber ?? "",
    siret: p.siret ?? "",
  };
}

export function ProfileForm() {
  const formId = useId();
  const errorId = `${formId}-error`;
  const successId = `${formId}-success`;

  const [values, setValues] = useState<FreelancerProfileDto>(emptyForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const token = getAccessTokenFromStorage();
    if (!token) {
      redirectToLogin();
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const user = await fetchSellerProfile(token);
        if (!cancelled) {
          setValues(fromProfile(user.profile));
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
  }, []);

  useEffect(() => {
    if (!error) return;
    errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [error]);

  function field<K extends keyof FreelancerProfileDto>(
    key: K,
    label: string,
    opts?: { type?: string },
  ) {
    const id = `${formId}-${String(key)}`;
    return (
      <div className="grid gap-2" key={String(key)}>
        <Label htmlFor={id}>{label}</Label>
        <Input
          id={id}
          name={String(key)}
          type={opts?.type ?? "text"}
          value={String(values[key] ?? "")}
          onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
          disabled={saving || loading}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : success ? successId : undefined}
        />
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const token = getAccessTokenFromStorage();
    if (!token) {
      redirectToLogin();
      return;
    }
    const displayName = values.displayName.trim();
    const legalName = values.legalName.trim();
    const addressLine1 = values.addressLine1.trim();
    const postalCode = values.postalCode.trim();
    const city = values.city.trim();
    if (!displayName || !legalName || !addressLine1 || !postalCode || !city) {
      setError(
        "Renseignez au minimum le nom affiché, le nom légal, l’adresse, le code postal et la ville.",
      );
      return;
    }
    setSaving(true);
    try {
      const payload: Partial<FreelancerProfileDto> = {
        displayName,
        legalName,
        addressLine1,
        postalCode,
        city,
        country: (values.country || "FR").trim() || "FR",
      };
      const c = values.companyName?.trim();
      if (c) payload.companyName = c;
      const a2 = values.addressLine2?.trim();
      if (a2) payload.addressLine2 = a2;
      const vat = values.vatNumber?.trim();
      if (vat) payload.vatNumber = vat;
      const siret = values.siret?.trim();
      if (siret) payload.siret = siret;

      const user = await patchSellerProfile(token, payload);
      setValues(fromProfile(user.profile));
      setSuccess("Profil enregistré.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="p-8 text-sm text-muted-foreground">Chargement du profil…</p>;
  }

  return (
    <form className="mx-auto max-w-xl space-y-6 p-8" onSubmit={(e) => void onSubmit(e)}>
      <div>
        <h1 className="text-xl font-semibold text-foreground">Profil vendeur</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ces informations peuvent apparaître sur vos factures et PDF.
        </p>
      </div>

      {error ? (
        <Alert ref={errorRef} variant="destructive" id={errorId} role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {success ? (
        <Alert id={successId} role="status">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {field("displayName", "Nom affiché")}
        {field("legalName", "Nom légal")}
        {field("companyName", "Société (optionnel)")}
        {field("addressLine1", "Adresse ligne 1")}
        {field("addressLine2", "Adresse ligne 2 (optionnel)")}
        {field("postalCode", "Code postal")}
        {field("city", "Ville")}
        {field("country", "Pays (code ISO, ex. FR)")}
        {field("vatNumber", "N° TVA (optionnel)")}
        {field("siret", "SIRET (14 chiffres, optionnel)")}
      </div>

      <Button type="submit" disabled={saving}>
        {saving ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
