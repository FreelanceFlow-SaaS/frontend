import { Suspense } from "react";
import { InvoicesList } from "@/modules/invoices/components/invoices-list";

export default function FacturesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-muted-foreground" aria-live="polite">
          Chargement…
        </div>
      }
    >
      <InvoicesList />
    </Suspense>
  );
}
