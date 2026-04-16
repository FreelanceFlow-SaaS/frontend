import { describe, expect, it } from "vitest";
import type { InvoiceDto } from "@/lib/api/invoices-api";
import {
  INVOICE_EXPORT_SCHEMA_V1_COLUMNS,
  buildInvoiceExportFilenameV1,
  invoicesToCsvV1,
} from "@/modules/invoices/utils/invoices-export-csv";

const baseInvoice: InvoiceDto = {
  id: "i1",
  clientId: "c1",
  invoiceNumber: "FF-2026-0001",
  status: "draft",
  issueDate: "2026-01-10",
  dueDate: null,
  currency: "EUR",
  totalHt: "100.00",
  totalVat: "20.00",
  totalTtc: "120.00",
  createdAt: "2026-01-10T10:00:00.000Z",
  updatedAt: "2026-01-10T10:00:00.000Z",
  client: {
    id: "c1",
    name: 'Acme "FR"\nSAS',
    email: "a@acme.fr",
    company: "Acme SAS",
    address: "Paris",
  },
  lines: [],
};

describe("invoicesToCsvV1", () => {
  it("includes BOM, header, and preserves totals as strings", () => {
    const csv = invoicesToCsvV1([baseInvoice], { delimiter: ";", includeBom: true, newline: "\n" });

    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain(INVOICE_EXPORT_SCHEMA_V1_COLUMNS.join(";"));
    expect(csv).toContain("FF-2026-0001");
    expect(csv).toContain(";100.00;20.00;120.00;");
    expect(csv).not.toContain("clientId");
  });

  it("escapes delimiters, quotes and newlines", () => {
    const csv = invoicesToCsvV1([baseInvoice], {
      delimiter: ";",
      includeBom: false,
      newline: "\n",
    });
    // clientName contains quotes + newline -> must be quoted and quotes doubled
    expect(csv).toContain('"Acme ""FR""\nSAS"');
  });
});

describe("buildInvoiceExportFilenameV1", () => {
  it("builds a deterministic filename for a given date", () => {
    const name = buildInvoiceExportFilenameV1(new Date("2026-04-16T12:00:00.000Z"));
    expect(name).toBe("invoices_export_v1_2026-04-16.csv");
  });
});
