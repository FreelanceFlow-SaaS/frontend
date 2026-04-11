import { Suspense } from "react";
import { InvoiceDetailView } from "@/modules/invoices/components/invoice-detail-view";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function InvoiceDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-muted-foreground" aria-live="polite">
          Chargement…
        </div>
      }
    >
      <InvoiceDetailView invoiceId={id} />
    </Suspense>
  );
}
