"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyDisplay } from "@/components/shared/money-display";
import { DeleteInvoiceDialog } from "@/modules/invoices/components/delete-invoice-dialog";
import { InvoiceLinesEditor } from "@/modules/invoices/components/invoice-lines-editor";
import { InvoiceStatusActions } from "@/modules/invoices/components/invoice-status-actions";
import { InvoicePdfActions } from "@/modules/invoices/components/invoice-pdf-actions";
import { InvoiceTotalsPanel } from "@/modules/invoices/components/invoice-totals-panel";
import { fetchInvoice, updateInvoice, type InvoiceDto } from "@/lib/api/invoices-api";
import { getAccessTokenFromStorage } from "@/lib/auth/session";
import { invoiceStatusLabel } from "@/modules/invoices/utils/invoice-i18n";

type InvoiceDetailViewProps = {
  invoiceId: string;
};

function toInputDate(iso: string): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function formatVatRatePct(v: string | number): string {
  const n = typeof v === "string" ? Number.parseFloat(v) : v;
  if (!Number.isFinite(n)) return "—";
  return `${Math.round(n * 100)} %`;
}

export function InvoiceDetailView({ invoiceId }: InvoiceDetailViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [invoice, setInvoice] = useState<InvoiceDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [savingMeta, setSavingMeta] = useState(false);

  const load = useCallback(async () => {
    const token = getAccessTokenFromStorage();
    if (!token) {
      setError("Session expirée.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const inv = await fetchInvoice(token, invoiceId);
      setInvoice(inv);
      setIssueDate(toInputDate(inv.issueDate));
      setDueDate(inv.dueDate ? toInputDate(inv.dueDate) : "");
    } catch (e) {
      setInvoice(null);
      setError(e instanceof Error ? e.message : "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (searchParams.get("created")) {
      setNotice(
        "Brouillon créé. Vous pouvez ajuster les dates ci-dessous puis modifier les lignes.",
      );
      router.replace(`/factures/${invoiceId}`, { scroll: false });
    }
  }, [searchParams, router, invoiceId]);

  async function saveMetadata(e: React.FormEvent) {
    e.preventDefault();
    const token = getAccessTokenFromStorage();
    if (!token || !invoice || invoice.status !== "draft") return;
    setSavingMeta(true);
    setError(null);
    try {
      const updated = await updateInvoice(token, invoice.id, {
        issueDate,
        dueDate: dueDate || null,
      });
      setInvoice(updated);
      setNotice("Dates enregistrées.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enregistrement impossible.");
    } finally {
      setSavingMeta(false);
    }
  }

  if (loading) {
    return <p className="p-8 text-sm text-muted-foreground">Chargement de la facture…</p>;
  }

  if (error && !invoice) {
    return (
      <div className="p-8">
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/factures">Retour à la liste</Link>
        </Button>
      </div>
    );
  }

  if (!invoice) return null;

  const isDraft = invoice.status === "draft";
  const sortedLines = [...invoice.lines].sort((a, b) => a.lineOrder - b.lineOrder);

  return (
    <div className="p-8">
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
          <Link href="/factures">← Factures</Link>
        </Button>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">{invoice.invoiceNumber}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Client : {invoice.client.name} — {invoice.client.email}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {invoice.status === "draft" || invoice.status === "cancelled" ? (
              <DeleteInvoiceDialog
                invoiceId={invoice.id}
                invoiceNumber={invoice.invoiceNumber}
                onDeleted={() => {
                  router.push("/factures?deleted=1");
                }}
              />
            ) : null}
            <p className="text-sm text-foreground">
              <span className="sr-only">Statut : </span>
              <span className="inline-flex rounded-md border border-border bg-muted/40 px-2 py-1 font-medium">
                {invoiceStatusLabel(invoice.status)}
              </span>
            </p>
          </div>
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

      <div className="mb-8">
        <InvoiceStatusActions
          invoice={invoice}
          onUpdated={(inv) => {
            setInvoice(inv);
            setNotice("Statut mis à jour.");
            setError(null);
          }}
        />
      </div>

      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[1fr_16rem] lg:items-start lg:gap-8">
        <div className="min-w-0 space-y-8">
          {isDraft ? (
            <section aria-labelledby="invoice-meta-heading">
              <h2 id="invoice-meta-heading" className="text-sm font-semibold text-foreground">
                Dates
              </h2>
              <form
                className="mt-3 flex max-w-md flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end"
                onSubmit={(e) => void saveMetadata(e)}
              >
                <div className="grid gap-2">
                  <Label htmlFor="inv-issue">Émission</Label>
                  <Input
                    id="inv-issue"
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    disabled={savingMeta}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="inv-due">Échéance</Label>
                  <Input
                    id="inv-due"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    disabled={savingMeta}
                  />
                </div>
                <Button type="submit" disabled={savingMeta}>
                  {savingMeta ? "Enregistrement…" : "Enregistrer les dates"}
                </Button>
              </form>
            </section>
          ) : (
            <p className="text-sm text-muted-foreground">
              Émission : {new Date(invoice.issueDate).toLocaleDateString("fr-FR")}
              {invoice.dueDate
                ? ` — Échéance : ${new Date(invoice.dueDate).toLocaleDateString("fr-FR")}`
                : null}
            </p>
          )}

          <section aria-labelledby="invoice-lines-heading">
            <h2 id="invoice-lines-heading" className="text-sm font-semibold text-foreground">
              Lignes
            </h2>
            {isDraft ? (
              <div className="mt-4">
                <InvoiceLinesEditor
                  invoiceId={invoice.id}
                  lines={invoice.lines}
                  onSaved={(inv) => {
                    setInvoice(inv);
                    setNotice("Lignes enregistrées.");
                    setError(null);
                  }}
                />
              </div>
            ) : (
              <>
                <p className="mt-2 text-sm text-muted-foreground">
                  Cette facture n&apos;est plus en brouillon : les lignes ne sont plus modifiables.
                  Les montants affichés proviennent du serveur.
                </p>
                <div className="mt-4 overflow-x-auto rounded-lg border border-border">
                  <table className="w-full min-w-[36rem] text-left text-sm">
                    <caption className="sr-only">Lignes de facture</caption>
                    <thead className="border-b border-border bg-muted/50">
                      <tr>
                        <th scope="col" className="px-3 py-2 font-medium">
                          #
                        </th>
                        <th scope="col" className="px-3 py-2 font-medium">
                          Description
                        </th>
                        <th scope="col" className="px-3 py-2 text-right font-medium tabular-nums">
                          Qté
                        </th>
                        <th scope="col" className="px-3 py-2 text-right font-medium tabular-nums">
                          PU HT
                        </th>
                        <th scope="col" className="px-3 py-2 text-right font-medium">
                          TVA
                        </th>
                        <th scope="col" className="px-3 py-2 text-right font-medium tabular-nums">
                          TTC
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedLines.map((line) => (
                        <tr key={line.id} className="border-b border-border last:border-0">
                          <td className="px-3 py-2 tabular-nums text-muted-foreground">
                            {line.lineOrder}
                          </td>
                          <td className="px-3 py-2">{line.description}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                            {String(line.quantity).replace(".", ",")}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <MoneyDisplay amount={line.unitPriceHt} />
                          </td>
                          <td className="px-3 py-2 text-right text-muted-foreground">
                            {formatVatRatePct(line.vatRate)}
                          </td>
                          <td className="px-3 py-2 text-right font-medium">
                            <MoneyDisplay amount={line.lineTtc} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <InvoiceTotalsPanel
            totalHt={invoice.totalHt}
            totalVat={invoice.totalVat}
            totalTtc={invoice.totalTtc}
          />
          <InvoicePdfActions invoiceId={invoice.id} invoiceNumber={invoice.invoiceNumber} />
        </div>
      </div>
    </div>
  );
}
