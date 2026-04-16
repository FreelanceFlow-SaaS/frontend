This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## API (NestJS)

The browser calls the **FreelanceFlow Nest API** directly with `fetch` and `credentials: "include"` so HttpOnly refresh cookies (`refreshToken`) are stored for `http://localhost:3001`. CORS on the API must allow `http://localhost:3000` (see `FRONTEND_URL` in the backend).

- Configure the API root with `NEXT_PUBLIC_API_URL` (see [`.env.example`](./.env.example)). Default: `http://localhost:3001/api/v1`.
- The SPA stores the JWT access token in `localStorage` and mirrors it in a **non-HttpOnly** cookie `ff_access_token` so Next.js middleware can gate routes; use a stricter strategy in production if you move to a BFF.

## export-schema=v1 (CSV exports)

### Invoice export schema (invoice-export-schema=v1)

- **Encoding**: UTF-8 **with BOM** (Excel-friendly)
- **Delimiter**: `;`
- **Newlines**: `CRLF` (`\r\n`)
- **Decimals**: exported **as received from the API** (no client-side recomputation). For now, the frontend dumps the JSON values as strings; typical format is fixed decimal with `.` (e.g. `120.00`).

**Columns (in order)**:

`id`, `numéro_facture`, `nom_client`, `société_client`, `statut`, `date_émission`, `date_échéance`, `devise`, `totalHT`, `totalTVA`, `totalTTC`, `créé_le`, `mis_à_jour_le`

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Présentation de la pipeline CI

Ce projet utilise une pipeline d'intégration continue (CI) pour automatiser les tests, la vérification de la qualité du code et le déploiement.  
La CI permet de s'assurer que chaque modification du code est testée, validée et prête à être mise en production en toute sécurité.

### Étapes principales de la pipeline CI :

1. **Installation des dépendances**  
   Toutes les dépendances sont installées pour garantir un environnement cohérent à chaque build.

2. **Vérification du formatage**  
   Le code est automatiquement formaté avec Prettier (`npm run format:check`) pour garantir une base de code uniforme.

3. **Linting**  
   L'outil ESLint (`npm run lint`) vérifie la qualité et les bonnes pratiques du code.

4. **Tests automatisés**  
   Les tests unitaires sont lancés avec Vitest (`npm run test`) pour éviter toute régression.

5. **Build de l'application**  
   Le code est compilé et optimisé via `npm run build` pour s'assurer que le build passe correctement avant le déploiement.

6. **Déploiement continu (CD)**  
   Si toutes les étapes précédentes passent avec succès, le code est déployé automatiquement sur la plateforme choisie (ici, Vercel).

---

> **Astuce :**  
> Pour personnaliser ou voir la configuration CI, consulte les fichiers spécifiques (par exemple `.github/workflows/`, `vercel.json`, ou la configuration de la plateforme employée).
