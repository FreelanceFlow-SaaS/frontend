import { Suspense } from "react";
import { ClientsList } from "@/modules/clients/components/clients-list";

export default function ClientsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-muted-foreground" aria-live="polite">
          Chargement…
        </div>
      }
    >
      <ClientsList />
    </Suspense>
  );
}
