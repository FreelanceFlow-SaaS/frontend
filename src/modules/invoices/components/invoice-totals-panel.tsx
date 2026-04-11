import { MoneyDisplay } from "@/components/shared/money-display";

type InvoiceTotalsPanelProps = {
  totalHt: string | number;
  totalVat: string | number;
  totalTtc: string | number;
  loading?: boolean;
};

export function InvoiceTotalsPanel({
  totalHt,
  totalVat,
  totalTtc,
  loading,
}: InvoiceTotalsPanelProps) {
  return (
    <aside
      className="rounded-lg border border-border bg-muted/20 p-4 lg:sticky lg:top-4"
      aria-labelledby="invoice-totals-heading"
    >
      <h2 id="invoice-totals-heading" className="text-sm font-semibold text-foreground">
        Synthèse
      </h2>
      {loading ? (
        <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">
          Mise à jour des montants…
        </p>
      ) : (
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Total HT</dt>
            <dd className="tabular-nums font-medium text-foreground">
              <MoneyDisplay amount={totalHt} />
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">TVA</dt>
            <dd className="tabular-nums font-medium text-foreground">
              <MoneyDisplay amount={totalVat} />
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-border pt-2">
            <dt className="font-medium text-foreground">Total TTC</dt>
            <dd className="tabular-nums font-semibold text-foreground">
              <MoneyDisplay amount={totalTtc} />
            </dd>
          </div>
        </dl>
      )}
    </aside>
  );
}
