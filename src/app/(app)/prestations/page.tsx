import { Suspense } from "react";
import { ServicesList } from "@/modules/services/components/services-list";

export default function PrestationsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-muted-foreground" aria-live="polite">
          Chargement…
        </div>
      }
    >
      <ServicesList />
    </Suspense>
  );
}
