"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ResourceEmptyState } from "@/components/shared/resource-empty-state";
import { DeleteClientDialog } from "@/modules/clients/components/delete-client-dialog";
import { fetchClients, type ClientDto } from "@/lib/api/clients-api";
import { getAccessTokenFromStorage } from "@/lib/auth/session";

function TableSkeleton() {
  return (
    <div className="space-y-2 p-8" aria-busy="true" aria-label="Chargement de la liste des clients">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-12 animate-pulse rounded-md bg-muted" />
      ))}
    </div>
  );
}

export function ClientsList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [clients, setClients] = useState<ClientDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const created = searchParams.get("created");
    const updated = searchParams.get("updated");
    const deleted = searchParams.get("deleted");
    if (created) setNotice("Client créé avec succès.");
    else if (updated) setNotice("Client mis à jour.");
    else if (deleted) setNotice("Client supprimé.");
    if (created || updated || deleted) {
      router.replace("/clients", { scroll: false });
    }
  }, [searchParams, router]);

  const load = useCallback(async (): Promise<void> => {
    const token = getAccessTokenFromStorage();
    if (!token) {
      setError("Session expirée. Reconnectez-vous.");
      setLoading(false);
      setClients(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchClients(token);
      setClients(data);
    } catch (e) {
      setClients(null);
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
          <h1 className="text-xl font-semibold text-foreground">Clients</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gérez les clients utilisés sur vos factures.
          </p>
        </div>
        <Button asChild>
          <Link href="/clients/new">Ajouter un client</Link>
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

      {!loading && !error && clients?.length === 0 ? (
        <ResourceEmptyState
          title="Aucun client pour le moment"
          description="Ajoutez votre premier client pour pouvoir le sélectionner lors de la création d'une facture."
          action={
            <Button asChild>
              <Link href="/clients/new">Ajouter un client</Link>
            </Button>
          }
        />
      ) : null}

      {!loading && !error && clients && clients.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <caption className="sr-only">Liste de vos clients</caption>
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium text-foreground">
                  Nom
                </th>
                <th scope="col" className="px-4 py-3 font-medium text-foreground">
                  E-mail
                </th>
                <th scope="col" className="px-4 py-3 font-medium text-foreground">
                  Entreprise
                </th>
                <th scope="col" className="px-4 py-3 font-medium text-foreground">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/clients/${c.id}/edit`}
                      className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.company}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/clients/${c.id}/edit`}>Modifier</Link>
                      </Button>
                      <DeleteClientDialog
                        clientId={c.id}
                        clientName={c.name}
                        onDeleted={() => {
                          void (async () => {
                            await load();
                            router.push("/clients?deleted=1");
                          })();
                        }}
                      />
                    </div>
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
