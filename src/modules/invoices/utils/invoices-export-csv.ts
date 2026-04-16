import type { InvoiceDto } from "@/lib/api/invoices-api";

export const INVOICE_EXPORT_SCHEMA_V1_COLUMNS = [
  "id",
  "numéro_facture",
  "nom_client",
  "société_client",
  "statut",
  "date_émission",
  "date_échéance",
  "devise",
  "totalHT",
  "totalTVA",
  "totalTTC",
  "créé_le",
  "mis_à_jour_le",
] as const;

export type InvoiceExportSchemaV1Column = (typeof INVOICE_EXPORT_SCHEMA_V1_COLUMNS)[number];

function toScalarString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "bigint" || typeof value === "boolean")
    return String(value);
  return JSON.stringify(value);
}

function escapeCsvCell(value: string, delimiter: string): string {
  const needsQuoting =
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r") ||
    value.includes(delimiter);
  if (!needsQuoting) return value;
  return `"${value.replaceAll('"', '""')}"`;
}

export type InvoiceCsvExportOptions = {
  delimiter?: ";" | "," | "\t";
  includeBom?: boolean;
  newline?: "\n" | "\r\n";
};

/**
 * Returns a UTF-8 CSV string for invoices, using export-schema=v1.
 * Important: totals are dumped as received from the API (no client-side recomputation).
 */
export function invoicesToCsvV1(
  invoices: InvoiceDto[],
  options: InvoiceCsvExportOptions = {},
): string {
  const delimiter = options.delimiter ?? ";";
  const newline = options.newline ?? "\r\n";
  const includeBom = options.includeBom ?? true;

  const header = INVOICE_EXPORT_SCHEMA_V1_COLUMNS.join(delimiter);
  const rows = invoices.map((inv) => {
    const cells: Record<InvoiceExportSchemaV1Column, string> = {
      id: toScalarString(inv.id),
      numéro_facture: toScalarString(inv.invoiceNumber),
      nom_client: toScalarString(inv.client?.name),
      société_client: toScalarString(inv.client?.company),
      statut: toScalarString(inv.status),
      date_émission: toScalarString(inv.issueDate),
      date_échéance: toScalarString(inv.dueDate ?? ""),
      devise: toScalarString(inv.currency),
      totalHT: toScalarString(inv.totalHt),
      totalTVA: toScalarString(inv.totalVat),
      totalTTC: toScalarString(inv.totalTtc),
      créé_le: toScalarString(inv.createdAt),
      mis_à_jour_le: toScalarString(inv.updatedAt),
    };

    return INVOICE_EXPORT_SCHEMA_V1_COLUMNS.map((col) => escapeCsvCell(cells[col], delimiter)).join(
      delimiter,
    );
  });

  const csvBody = [header, ...rows].join(newline) + newline;
  return includeBom ? `\uFEFF${csvBody}` : csvBody;
}

export function buildInvoiceExportFilenameV1(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `invoices_export_v1_${y}-${m}-${d}.csv`;
}
