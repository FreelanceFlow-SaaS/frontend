"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updateInvoiceLines,
  type CreateInvoiceLinePayload,
  type InvoiceDto,
  type InvoiceLineDto,
} from "@/lib/api/invoices-api";
import { fetchServices, type ServiceDto } from "@/lib/api/services-api";
import { getAccessTokenFromStorage } from "@/lib/auth/session";

type Row = {
  key: string;
  serviceId: string;
  description: string;
  quantity: string;
  unitPriceHt: string;
  vatRate: string;
};

function formatDecimalForInput(raw: string | number): string {
  const s = String(raw).trim().replace(",", ".");
  const n = Number.parseFloat(s);
  if (!Number.isFinite(n)) return "";
  return String(n).replace(".", ",");
}

function vatToInput(v: string | number): string {
  const n = typeof v === "string" ? Number.parseFloat(v) : v;
  if (!Number.isFinite(n)) return "0,2";
  return String(n).replace(".", ",");
}

function linesToRows(lines: InvoiceLineDto[]): Row[] {
  return [...lines]
    .sort((a, b) => a.lineOrder - b.lineOrder)
    .map((l) => ({
      key: l.id,
      serviceId: l.serviceId ?? "",
      description: l.description,
      quantity: formatDecimalForInput(l.quantity),
      unitPriceHt: formatDecimalForInput(l.unitPriceHt),
      vatRate: vatToInput(l.vatRate),
    }));
}

function parsePositiveDecimal(
  input: string,
  label: string,
): { ok: true; value: number } | { ok: false; message: string } {
  const t = input.trim().replace(/\s/g, "").replace(",", ".");
  if (!t) return { ok: false, message: `${label} est requis.` };
  if (!/^\d+(\.\d{1,2})?$/.test(t)) {
    return { ok: false, message: `${label} : nombre positif, max 2 décimales.` };
  }
  const n = Number(t);
  if (!(n > 0) || !Number.isFinite(n)) {
    return { ok: false, message: `${label} doit être supérieur à zéro.` };
  }
  return { ok: true, value: Math.round(n * 100) / 100 };
}

function parseVatRate(input: string): { ok: true; value: number } | { ok: false; message: string } {
  const t = input.trim().replace(",", ".");
  if (!t) return { ok: false, message: "TVA : indiquez un nombre entre 0 et 1 (ex. 0,20)." };
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0 || n > 1) {
    return { ok: false, message: "TVA entre 0 et 1 (ex. 0,20 pour 20 %)." };
  }
  return { ok: true, value: n };
}

function buildPayload(
  rows: Row[],
): { ok: true; lines: CreateInvoiceLinePayload[] } | { ok: false; message: string } {
  const out: CreateInvoiceLinePayload[] = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const desc = r.description.trim();
    if (!desc) {
      return { ok: false, message: `Ligne ${i + 1} : description obligatoire.` };
    }
    const q = parsePositiveDecimal(r.quantity, `Ligne ${i + 1} — quantité`);
    if (!q.ok) return { ok: false, message: q.message };
    const unit = parsePositiveDecimal(r.unitPriceHt, `Ligne ${i + 1} — prix unitaire HT`);
    if (!unit.ok) return { ok: false, message: unit.message };
    const vat = parseVatRate(r.vatRate);
    if (!vat.ok) return { ok: false, message: vat.message };

    const line: CreateInvoiceLinePayload = {
      lineOrder: i + 1,
      description: desc,
      quantity: q.value,
      unitPriceHt: unit.value,
      vatRate: vat.value,
    };
    if (r.serviceId) {
      line.serviceId = r.serviceId;
    }
    out.push(line);
  }
  return { ok: true, lines: out };
}

type InvoiceLinesEditorProps = {
  invoiceId: string;
  lines: InvoiceLineDto[];
  onSaved: (invoice: InvoiceDto) => void;
};

export function InvoiceLinesEditor({ invoiceId, lines, onSaved }: InvoiceLinesEditorProps) {
  const baseId = useId();
  const [rows, setRows] = useState<Row[]>(() => linesToRows(lines));
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRows(linesToRows(lines));
  }, [lines]);

  useEffect(() => {
    const token = getAccessTokenFromStorage();
    if (!token) {
      setLoadingServices(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchServices(token);
        if (!cancelled) setServices(list);
      } catch {
        if (!cancelled) setServices([]);
      } finally {
        if (!cancelled) setLoadingServices(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const applyServiceToRow = useCallback(
    (index: number, serviceId: string) => {
      setRows((prev) => {
        const next = [...prev];
        const row = { ...next[index] };
        row.serviceId = serviceId;
        if (serviceId) {
          const s = services.find((x) => x.id === serviceId);
          if (s) {
            row.description = s.title;
            row.unitPriceHt = formatDecimalForInput(s.hourlyRateHt);
          }
        }
        next[index] = row;
        return next;
      });
    },
    [services],
  );

  function addRow() {
    setRows((prev) => [
      ...prev,
      {
        key: `new-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        serviceId: "",
        description: "",
        quantity: "1",
        unitPriceHt: "",
        vatRate: "0,2",
      },
    ]);
  }

  function removeRow(index: number) {
    setRows((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }

  function moveRow(index: number, dir: -1 | 1) {
    setRows((prev) => {
      const j = index + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      const t = next[index];
      next[index] = next[j];
      next[j] = t;
      return next;
    });
  }

  async function save() {
    setError(null);
    const token = getAccessTokenFromStorage();
    if (!token) {
      setError("Session expirée.");
      return;
    }
    const built = buildPayload(rows);
    if (!built.ok) {
      setError(built.message);
      return;
    }
    setSaving(true);
    try {
      const inv = await updateInvoiceLines(token, invoiceId, built.lines);
      onSaved(inv);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Choisissez une prestation pour préremplir le libellé et le tarif (snapshot au moment de
        l&apos;enregistrement). Vous pouvez aussi saisir une ligne entièrement manuelle.
      </p>

      {error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <caption className="sr-only">Édition des lignes de facture</caption>
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th scope="col" className="px-2 py-2 font-medium">
                Prestation
              </th>
              <th scope="col" className="px-2 py-2 font-medium">
                Description
              </th>
              <th scope="col" className="px-2 py-2 font-medium tabular-nums">
                Qté
              </th>
              <th scope="col" className="px-2 py-2 font-medium tabular-nums">
                PU HT
              </th>
              <th scope="col" className="px-2 py-2 font-medium">
                TVA
              </th>
              <th scope="col" className="px-2 py-2 font-medium">
                <span className="sr-only">Ordre et suppression</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.key} className="border-b border-border last:border-0 align-top">
                <td className="px-2 py-2">
                  <Label htmlFor={`${baseId}-svc-${index}`} className="sr-only">
                    Prestation ligne {index + 1}
                  </Label>
                  <select
                    id={`${baseId}-svc-${index}`}
                    value={row.serviceId}
                    onChange={(e) => applyServiceToRow(index, e.target.value)}
                    disabled={saving || loadingServices}
                    className="h-9 w-full max-w-[10rem] rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Manuel</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-2">
                  <Input
                    aria-label={`Description ligne ${index + 1}`}
                    value={row.description}
                    onChange={(e) =>
                      setRows((prev) => {
                        const next = [...prev];
                        next[index] = { ...next[index], description: e.target.value };
                        return next;
                      })
                    }
                    disabled={saving}
                  />
                </td>
                <td className="px-2 py-2">
                  <Input
                    className="tabular-nums"
                    inputMode="decimal"
                    aria-label={`Quantité ligne ${index + 1}`}
                    value={row.quantity}
                    onChange={(e) =>
                      setRows((prev) => {
                        const next = [...prev];
                        next[index] = { ...next[index], quantity: e.target.value };
                        return next;
                      })
                    }
                    disabled={saving}
                  />
                </td>
                <td className="px-2 py-2">
                  <Input
                    className="tabular-nums"
                    inputMode="decimal"
                    aria-label={`Prix unitaire HT ligne ${index + 1}`}
                    value={row.unitPriceHt}
                    onChange={(e) =>
                      setRows((prev) => {
                        const next = [...prev];
                        next[index] = { ...next[index], unitPriceHt: e.target.value };
                        return next;
                      })
                    }
                    disabled={saving}
                  />
                </td>
                <td className="px-2 py-2">
                  <Input
                    className="tabular-nums"
                    inputMode="decimal"
                    aria-label={`TVA ligne ${index + 1}`}
                    value={row.vatRate}
                    onChange={(e) =>
                      setRows((prev) => {
                        const next = [...prev];
                        next[index] = { ...next[index], vatRate: e.target.value };
                        return next;
                      })
                    }
                    disabled={saving}
                  />
                </td>
                <td className="px-2 py-2">
                  <div className="flex flex-col gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      disabled={saving || index === 0}
                      onClick={() => moveRow(index, -1)}
                      aria-label={`Monter la ligne ${index + 1}`}
                    >
                      ↑
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      disabled={saving || index === rows.length - 1}
                      onClick={() => moveRow(index, 1)}
                      aria-label={`Descendre la ligne ${index + 1}`}
                    >
                      ↓
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-destructive"
                      disabled={saving || rows.length <= 1}
                      onClick={() => removeRow(index)}
                    >
                      Retirer
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={addRow} disabled={saving}>
          Ajouter une ligne
        </Button>
        <Button type="button" onClick={() => void save()} disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer les lignes"}
        </Button>
      </div>
    </div>
  );
}
