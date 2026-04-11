import { cn } from "@/lib/utils";

type MoneyDisplayProps = {
  /** Montant en unité majeure (ex. euros), nombre ou chaîne décimale sûre côté affichage */
  amount: string | number;
  className?: string;
};

/**
 * Affichage EUR cohérent (fr-FR) avec chiffres tabulaires (UX-DR11, UX-DR19).
 */
export function MoneyDisplay({ amount, className }: MoneyDisplayProps) {
  const raw = typeof amount === "string" ? amount.trim().replace(",", ".") : amount;
  const n = typeof raw === "number" ? raw : Number.parseFloat(raw);
  if (!Number.isFinite(n)) {
    return <span className={cn("tabular-nums", className)}>—</span>;
  }
  const formatted = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
  return <span className={cn("tabular-nums", className)}>{formatted}</span>;
}
