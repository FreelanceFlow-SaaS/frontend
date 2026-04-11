import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Inscription</h1>
        <p className="text-sm text-muted-foreground">
          Créez un compte avec votre e-mail et un mot de passe sécurisé (8 caractères minimum).
        </p>
      </div>
      <p className="text-center text-sm text-muted-foreground">
        Le formulaire sera branché sur l&apos;API dans la foulée des thèmes.
      </p>
      <div className="text-center">
        <Button asChild variant="link">
          <Link href="/login">Déjà un compte ? Connexion</Link>
        </Button>
      </div>
    </div>
  );
}
