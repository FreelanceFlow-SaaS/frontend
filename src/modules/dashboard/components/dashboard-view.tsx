"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { MoneyDisplay } from "@/components/shared/money-display";
import { fetchDashboardSummary, type DashboardSummaryDto } from "@/lib/api/dashboard-api";
import { getAccessTokenFromStorage, redirectToLogin } from "@/lib/auth/session";

export function DashboardView() {
  const [summary, setSummary] = useState<DashboardSummaryDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const token = getAccessTokenFromStorage();
    if (!token) {
      redirectToLogin();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const summaryData = await fetchDashboardSummary(token);
      setSummary(summaryData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chargement impossible.");
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Tableau de bord</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vue synthétique de votre activité: chiffre d&apos;affaires encaissé et tendances.
        </p>
      </div>

      {error ? (
        <Alert variant="destructive" className="mb-6" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-28 animate-pulse rounded-lg border border-border bg-muted" />
          <div className="h-28 animate-pulse rounded-lg border border-border bg-muted" />
        </div>
      ) : null}

      {!loading && summary ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2" aria-label="Indicateurs principaux">
            <article className="rounded-lg border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">Revenu encaissé (TTC)</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                <MoneyDisplay amount={summary.totalRevenueTtc} />
              </p>
            </article>
            <article className="rounded-lg border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">Nombre total de factures</p>
              <p className="mt-2 text-2xl font-semibold text-foreground tabular-nums">
                {summary.invoiceCount}
              </p>
            </article>
          </section>

          <section className="mt-8 rounded-lg border border-border bg-card p-5">
            <h2 className="text-base font-semibold text-foreground">Répartition</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Les détails par client et par mois arrivent dans l&apos;itération suivante.
            </p>
          </section>
        </>
      ) : null}

      {!loading && !summary && !error ? (
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            Aucune donnée de tableau de bord disponible.
          </p>
          <Button type="button" variant="outline" className="mt-4" onClick={() => void load()}>
            Réessayer
          </Button>
        </div>
      ) : null}
    </div>
  );
}
