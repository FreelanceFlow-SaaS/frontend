"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { MoneyDisplay } from "@/components/shared/money-display";
import { fetchDashboardSummary, type DashboardSummaryDto } from "@/lib/api/dashboard-api";
import { fetchInvoices, type InvoiceDto } from "@/lib/api/invoices-api";
import { getAccessTokenFromStorage, redirectToLogin } from "@/lib/auth/session";

type RevenueByClient = {
  clientId: string;
  label: string;
  totalTtc: string;
};

type RevenueByMonth = {
  yearMonth: string;
  totalTtc: string;
};

function monthLabel(yearMonth?: string): string {
  if (!yearMonth || typeof yearMonth !== "string") return "Mois inconnu";
  const [year, month] = yearMonth.split("-");
  if (!year || !month) return "Mois inconnu";
  const date = new Date(Number(year), Number(month) - 1, 1);
  if (Number.isNaN(date.getTime())) return "Mois inconnu";
  return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(date);
}

function resolveAttributionDate(invoice: InvoiceDto): string {
  return invoice.paidAt ?? invoice.updatedAt;
}

function computeBreakdowns(invoices: InvoiceDto[]): {
  revenueByClient: RevenueByClient[];
  revenueByMonth: RevenueByMonth[];
} {
  const paid = invoices.filter((invoice) => invoice.status === "paid");
  const byClient = new Map<string, { label: string; total: number }>();
  const byMonth = new Map<string, number>();

  for (const invoice of paid) {
    const amount = Number.parseFloat(String(invoice.totalTtc).replace(",", "."));
    if (!Number.isFinite(amount)) continue;

    const clientEntry = byClient.get(invoice.clientId) ?? { label: invoice.client.name, total: 0 };
    clientEntry.total += amount;
    byClient.set(invoice.clientId, clientEntry);

    const d = new Date(resolveAttributionDate(invoice));
    const parisParts = new Intl.DateTimeFormat("fr-CA", {
      timeZone: "Europe/Paris",
      year: "numeric",
      month: "2-digit",
    }).formatToParts(d);
    const year = parisParts.find((p) => p.type === "year")?.value ?? "1970";
    const month = parisParts.find((p) => p.type === "month")?.value ?? "01";
    const key = `${year}-${month}`;
    byMonth.set(key, (byMonth.get(key) ?? 0) + amount);
  }

  return {
    revenueByClient: Array.from(byClient.entries())
      .map(([clientId, value]) => ({
        clientId,
        label: value.label,
        totalTtc: value.total.toFixed(2),
      }))
      .sort((a, b) => Number.parseFloat(b.totalTtc) - Number.parseFloat(a.totalTtc)),
    revenueByMonth: Array.from(byMonth.entries())
      .map(([yearMonth, total]) => ({ yearMonth, totalTtc: total.toFixed(2) }))
      .sort((a, b) => a.yearMonth.localeCompare(b.yearMonth)),
  };
}

export function DashboardView() {
  const [summary, setSummary] = useState<DashboardSummaryDto | null>(null);
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
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
      const [summaryData, invoicesData] = await Promise.all([
        fetchDashboardSummary(token),
        fetchInvoices(token),
      ]);
      setSummary(summaryData);
      setInvoices(invoicesData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chargement impossible.");
      setSummary(null);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const fallbackBreakdowns = useMemo(() => computeBreakdowns(invoices), [invoices]);
  const summaryRevenueByClient =
    summary?.revenueByClient?.filter((row) => Boolean(row?.clientId && row?.label)) ?? [];
  const summaryRevenueByMonth =
    summary?.revenueByMonth?.filter((row) => Boolean(row?.yearMonth)) ?? [];

  const revenueByClient =
    summaryRevenueByClient.length > 0 ? summaryRevenueByClient : fallbackBreakdowns.revenueByClient;
  const revenueByMonth =
    summaryRevenueByMonth.length > 0 ? summaryRevenueByMonth : fallbackBreakdowns.revenueByMonth;

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

          <section className="mt-8 grid gap-6 lg:grid-cols-2">
            <article className="rounded-lg border border-border bg-card p-5">
              <h2 className="text-base font-semibold text-foreground">Revenus par client</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Basé sur les factures au statut payé.
              </p>
              {revenueByClient.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">Aucun revenu client encaissé.</p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {revenueByClient.map((row) => (
                    <li
                      key={row.clientId}
                      className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
                    >
                      <span className="truncate text-sm text-foreground">{row.label}</span>
                      <MoneyDisplay amount={row.totalTtc} className="text-sm font-medium" />
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <article className="rounded-lg border border-border bg-card p-5">
              <h2 className="text-base font-semibold text-foreground">Revenus par mois</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Agrégation mensuelle calendrier (Europe/Paris).
              </p>
              {revenueByMonth.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  Aucun mois avec revenu encaissé.
                </p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {revenueByMonth.map((row) => (
                    <li
                      key={row.yearMonth}
                      className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
                    >
                      <span className="text-sm text-foreground">{monthLabel(row.yearMonth)}</span>
                      <MoneyDisplay amount={row.totalTtc} className="text-sm font-medium" />
                    </li>
                  ))}
                </ul>
              )}
            </article>
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
