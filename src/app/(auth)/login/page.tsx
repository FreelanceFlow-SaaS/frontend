import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Connexion</h1>
        <p className="text-sm text-muted-foreground">
          Accédez à votre espace FreelanceFlow pour gérer vos factures.
        </p>
      </div>
      <p className="text-center text-sm text-muted-foreground">
        Le formulaire sera branché sur l&apos;API dans la foulée des thèmes.
      </p>
      <div className="text-center">
        <Button asChild variant="link">
          <Link href="/register">Pas encore de compte ? Inscription</Link>
        </Button>
      </div>
    </div>
  );
}
