"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { MoneyDisplay } from "@/components/shared/money-display";
import { ResourceEmptyState } from "@/components/shared/resource-empty-state";
import { fetchServices, type ServiceDto } from "@/lib/api/services-api";
import { getAccessTokenFromStorage } from "@/lib/auth/session";

function TableSkeleton() {
  return (
    <div
      className="space-y-2 p-8"
      aria-busy="true"
      aria-label="Chargement de la liste des prestations"
    >
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-12 animate-pulse rounded-md bg-muted" />
      ))}
    </div>
  );
}

export function ServicesList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [services, setServices] = useState<ServiceDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const created = searchParams.get("created");
    const updated = searchParams.get("updated");
    if (created) setNotice("Prestation créée avec succès.");
    else if (updated) setNotice("Prestation mise à jour.");
    if (created || updated) {
      router.replace("/prestations", { scroll: false });
    }
  }, [searchParams, router]);

  const load = useCallback(async (): Promise<void> => {
    const token = getAccessTokenFromStorage();
    if (!token) {
      setError("Session expirée. Reconnectez-vous.");
      setLoading(false);
      setServices(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchServices(token);
      setServices(data);
    } catch (e) {
      setServices(null);
      setError(e instanceof Error ? e.message : "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Prestations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Définissez vos prestations facturables et leurs tarifs horaires HT.
          </p>
        </div>
        <Button asChild>
          <Link href="/prestations/new">Ajouter une prestation</Link>
        </Button>
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

      {!loading && !error && services?.length === 0 ? (
        <ResourceEmptyState
          title="Aucune prestation pour le moment"
          description="Créez votre première prestation pour préremplir les lignes de facture avec un titre et un taux horaire HT."
          action={
            <Button asChild>
              <Link href="/prestations/new">Ajouter une prestation</Link>
            </Button>
          }
        />
      ) : null}

      {!loading && !error && services && services.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <caption className="sr-only">Liste de vos prestations</caption>
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium text-foreground">
                  Titre
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-right font-medium text-foreground tabular-nums"
                >
                  Taux horaire HT
                </th>
                <th scope="col" className="px-4 py-3 font-medium text-foreground">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/prestations/${s.id}/edit`}
                      className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      {s.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    <MoneyDisplay amount={s.hourlyRateHt} />
                    <span className="sr-only"> euros par heure</span>
                    <span className="text-xs text-muted-foreground" aria-hidden="true">
                      {" "}
                      / h
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/prestations/${s.id}/edit`}>Modifier</Link>
                    </Button>
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
