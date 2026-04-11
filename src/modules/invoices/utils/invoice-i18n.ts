import type { InvoiceStatus } from "@/lib/api/invoices-api";

export function invoiceStatusLabel(status: InvoiceStatus): string {
  switch (status) {
    case "draft":
      return "Brouillon";
    case "sent":
      return "Envoyée";
    case "paid":
      return "Payée";
    case "cancelled":
      return "Annulée";
    default:
      return status;
  }
}
