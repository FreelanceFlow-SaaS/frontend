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
