"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { MoneyDisplay } from "@/components/shared/money-display";
import { ResourceEmptyState } from "@/components/shared/resource-empty-state";
import { fetchInvoices, type InvoiceDto } from "@/lib/api/invoices-api";
import { getAccessTokenFromStorage } from "@/lib/auth/session";
import { invoiceStatusLabel } from "@/modules/invoices/utils/invoice-i18n";

type SortMode = "date" | "status";

function sortInvoices(rows: InvoiceDto[], mode: SortMode): InvoiceDto[] {
  const copy = [...rows];
  if (mode === "date") {
    copy.sort(
      (a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime(),
    );
  } else {
    const order: Record<string, number> = {
      draft: 0,
      sent: 1,
      paid: 2,
      cancelled: 3,
    };
    copy.sort((a, b) => {
      const d = order[a.status] - order[b.status];
      if (d !== 0) return d;
      return new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime();
    });
  }
  return copy;
}

function TableSkeleton() {
  return (
    <div className="space-y-2 p-8" aria-busy="true" aria-label="Chargement de la liste des factures">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-12 animate-pulse rounded-md bg-muted" />
      ))}
    </div>
  );
}

export function InvoicesList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [invoices, setInvoices] = useState<InvoiceDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("date");

  useEffect(() => {
    const created = searchParams.get("created");
    if (created) setNotice("Facture créée. Vous pouvez compléter les lignes si besoin.");
    if (created) {
      router.replace("/factures", { scroll: false });
    }
  }, [searchParams, router]);

  const load = useCallback(async (): Promise<void> => {
    const token = getAccessTokenFromStorage();
    if (!token) {
      setError("Session expirée. Reconnectez-vous.");
      setLoading(false);
      setInvoices(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchInvoices(token);
      setInvoices(data);
    } catch (e) {
      setInvoices(null);
      setError(e instanceof Error ? e.message : "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sorted = useMemo(() => {
    if (!invoices) return [];
    return sortInvoices(invoices, sortMode);
  }, [invoices, sortMode]);

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Factures</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Consultez vos factures et suivez leur statut.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <label htmlFor="invoice-sort" className="text-sm text-muted-foreground whitespace-nowrap">
              Trier par
            </label>
            <select
              id="invoice-sort"
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="date">Date d&apos;émission</option>
              <option value="status">Statut</option>
            </select>
          </div>
          <Button asChild>
            <Link href="/factures/new">Nouvelle facture</Link>
          </Button>
        </div>
      </div>

      {notice ? (
        <Alert className="mb-6" role="status">
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="destructive" className="mb-6" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? <TableSkeleton /> : null}

      {!loading && !error && invoices?.length === 0 ? (
        <ResourceEmptyState
          title="Aucune facture pour le moment"
          description="Créez une première facture pour un client : numéro, montants et statut seront gérés automatiquement côté serveur."
          action={
            <Button asChild>
              <Link href="/factures/new">Nouvelle facture</Link>
            </Button>
          }
        />
      ) : null}

      {!loading && !error && sorted.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <caption className="sr-only">Liste de vos factures</caption>
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium text-foreground">
                  Numéro
                </th>
                <th scope="col" className="px-4 py-3 font-medium text-foreground">
                  Client
                </th>
                <th scope="col" className="px-4 py-3 font-medium text-foreground">
                  Émission
                </th>
                <th scope="col" className="px-4 py-3 font-medium text-foreground">
                  Statut
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-right font-medium text-foreground tabular-nums"
                >
                  TTC
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((inv) => (
                <tr key={inv.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/factures/${inv.id}`}
                      className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{inv.client.name}</td>
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">
                    {new Date(inv.issueDate).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs font-medium text-foreground">
                      {invoiceStatusLabel(inv.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <MoneyDisplay amount={inv.totalTtc} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
