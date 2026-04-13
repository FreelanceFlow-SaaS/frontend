"use client";

import Link from "next/link";
import { Instrument_Serif, DM_Sans } from "next/font/google";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const features = [
  {
    label: "Clients",
    desc: "Centralisez vos contacts, historiques et coordonnées en un seul endroit.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
        <path d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Prestations",
    desc: "Définissez vos services, tarifs horaires et conditions en quelques clics.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
        <path d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Factures",
    desc: "Créez des factures conformes avec calcul automatique HT, TVA et TTC.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
        <path d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Export PDF",
    desc: "Téléchargez ou envoyez vos factures au format PDF en un clic.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
        <path d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const steps = [
  { num: "01", title: "Inscrivez-vous", desc: "Créez votre compte en 30 secondes. Aucune carte requise." },
  { num: "02", title: "Configurez", desc: "Ajoutez vos clients et définissez vos prestations." },
  { num: "03", title: "Facturez", desc: "Générez des factures conformes et exportez-les en PDF." },
];

export function LandingPage() {
  return (
    <div className={`${dmSans.className} landing-root`}>
      {/* ━━━ NAV ━━━ */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <Link href="/" className="landing-logo" aria-label="FreelanceFlow accueil">
            <span className={instrumentSerif.className}>F</span>
            <span>reelanceFlow</span>
          </Link>
          <div className="landing-nav-links">
            <Link href="/login" className="landing-link">Connexion</Link>
            <Link href="/register" className="landing-cta-sm">Commencer</Link>
          </div>
        </div>
      </nav>

      {/* ━━━ HERO ━━━ */}
      <section className="landing-hero">
        <div className="landing-hero-grid" aria-hidden="true" />
        <div className="landing-hero-glow" aria-hidden="true" />

        <div className="landing-hero-content">
          <p className="landing-hero-badge lp-reveal" style={{ animationDelay: "0.1s" }}>
            <span className="landing-hero-badge-dot" />
            Conçu pour les freelances en France
          </p>

          <h1 className={`${instrumentSerif.className} landing-hero-h1 lp-reveal`} style={{ animationDelay: "0.25s" }}>
            Facturez sans <br className="hidden sm:inline" />
            <span className="landing-accent">friction.</span>
          </h1>

          <p className="landing-hero-sub lp-reveal" style={{ animationDelay: "0.4s" }}>
            Gérez vos clients, prestations et factures depuis une interface
            moderne. Calcul automatique HT/TVA/TTC, export PDF et suivi
            des statuts — tout ce qu&apos;il faut, rien de superflu.
          </p>

          <div className="landing-hero-actions lp-reveal" style={{ animationDelay: "0.55s" }}>
            <Link href="/register" className="landing-btn-primary">
              Créer mon compte
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
              </svg>
            </Link>
            <Link href="/login" className="landing-btn-outline">Se connecter</Link>
          </div>
        </div>

        <div className="landing-hero-diag" aria-hidden="true" />
      </section>

      {/* ━━━ FEATURES ━━━ */}
      <section className="landing-features" id="features">
        <div className="landing-section-inner">
          <p className="landing-section-label lp-reveal-scroll">Fonctionnalités</p>
          <h2 className={`${instrumentSerif.className} landing-section-h2 lp-reveal-scroll`}>
            Tout pour piloter votre activité
          </h2>

          <div className="landing-features-grid">
            {features.map((f, i) => (
              <div key={f.label} className="landing-feature-card lp-reveal-scroll" style={{ animationDelay: `${0.1 * i}s` }}>
                <div className="landing-feature-icon">{f.icon}</div>
                <h3 className="landing-feature-title">{f.label}</h3>
                <p className="landing-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ HOW IT WORKS ━━━ */}
      <section className="landing-steps">
        <div className="landing-section-inner">
          <p className="landing-section-label lp-reveal-scroll">Comment ça marche</p>
          <h2 className={`${instrumentSerif.className} landing-section-h2 lp-reveal-scroll`}>
            Prêt en trois étapes
          </h2>

          <div className="landing-steps-row">
            {steps.map((s, i) => (
              <div key={s.num} className="landing-step lp-reveal-scroll" style={{ animationDelay: `${0.15 * i}s` }}>
                <span className={`${instrumentSerif.className} landing-step-num`}>{s.num}</span>
                <h3 className="landing-step-title">{s.title}</h3>
                <p className="landing-step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ STATS ━━━ */}
      <section className="landing-stats">
        <div className="landing-section-inner">
          <div className="landing-stats-grid">
            {[
              { value: "100%", label: "Open source" },
              { value: "0 €", label: "Pour commencer" },
              { value: "<1 min", label: "Pour créer une facture" },
              { value: "PDF", label: "Export conforme" },
            ].map((s, i) => (
              <div key={s.label} className="landing-stat lp-reveal-scroll" style={{ animationDelay: `${0.1 * i}s` }}>
                <span className={`${instrumentSerif.className} landing-stat-value`}>{s.value}</span>
                <span className="landing-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ FINAL CTA ━━━ */}
      <section className="landing-final-cta">
        <div className="landing-final-cta-glow" aria-hidden="true" />
        <div className="landing-section-inner landing-final-cta-inner">
          <h2 className={`${instrumentSerif.className} landing-final-h2 lp-reveal-scroll`}>
            Simplifiez votre facturation <span className="landing-accent">dès aujourd&apos;hui.</span>
          </h2>
          <p className="landing-final-sub lp-reveal-scroll" style={{ animationDelay: "0.1s" }}>
            Inscription gratuite, sans carte bancaire. Commencez à facturer en moins d&apos;une minute.
          </p>
          <Link href="/register" className="landing-btn-primary lp-reveal-scroll" style={{ animationDelay: "0.2s" }}>
            Commencer gratuitement
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ━━━ FOOTER ━━━ */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <span className={`${instrumentSerif.className} landing-footer-logo`}>FreelanceFlow</span>
          <span className="landing-footer-copy">&copy; {new Date().getFullYear()} &mdash; Projet open source sous licence MIT</span>
        </div>
      </footer>

      {/* ━━━ SCOPED STYLES (animations + decorative only) ━━━ */}
      <style jsx global>{`
        /* ── palette ── */
        .landing-root {
          /*
            Theme integration:
            Map landing page palette to the app semantic tokens so it follows
            the selected theme (light/dark + ocean/forest/etc) without moving UI.
          */
          --lp-bg: var(--background);
          /*
            Mixed "dark/light" blocks:
            - In light mode, --lp-bg2 becomes slightly darker than the page background.
            - In dark mode, --lp-bg2 becomes slightly lighter than the page background.
            This creates alternating sections without hardcoding colors.
          */
          --lp-bg2: color-mix(in oklch, var(--background) 92%, var(--foreground) 8%);
          --lp-surface: var(--card);
          --lp-border: var(--border);
          --lp-text: var(--foreground);
          --lp-text-muted: var(--muted-foreground);
          --lp-accent: var(--primary);
          --lp-accent-hover: color-mix(in oklch, var(--primary) 88%, white);
          --lp-accent-glow: color-mix(in oklch, var(--primary) 16%, transparent);
          background: var(--lp-bg);
          color: var(--lp-text);
          min-height: 100vh;
          overflow-x: hidden;
        }
        .landing-accent { color: var(--lp-accent); }

        /* ── animations ── */
        @keyframes lp-reveal {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .lp-reveal {
          opacity: 0;
          animation: lp-reveal 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .lp-reveal-scroll {
          opacity: 0;
          animation: lp-reveal 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          animation-timeline: view();
          animation-range: entry 0% entry 30%;
        }
        @supports not (animation-timeline: view()) {
          .lp-reveal-scroll { opacity: 1; transform: none; }
        }

        /* ── nav ── */
        .landing-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 50;
          backdrop-filter: blur(16px) saturate(1.4);
          -webkit-backdrop-filter: blur(16px) saturate(1.4);
          background: color-mix(in oklch, var(--lp-bg) 72%, transparent);
          border-bottom: 1px solid var(--lp-border);
        }
        .landing-nav-inner {
          max-width: 1200px; margin: 0 auto; padding: 0 1.5rem;
          height: 64px; display: flex; align-items: center; justify-content: space-between;
        }
        .landing-logo {
          font-size: 1.25rem; font-weight: 600; letter-spacing: -0.02em;
          color: var(--lp-text); text-decoration: none; display: flex; align-items: baseline;
        }
        .landing-logo span:first-child { font-size: 1.5rem; color: var(--lp-accent); }
        .landing-nav-links { display: flex; align-items: center; gap: 1rem; }
        .landing-link {
          font-size: 0.875rem; color: var(--lp-text-muted); text-decoration: none; transition: color 0.2s;
        }
        .landing-link:hover { color: var(--lp-text); }
        .landing-cta-sm {
          font-size: 0.875rem; font-weight: 600; padding: 0.5rem 1.25rem; border-radius: 8px;
          background: var(--lp-accent); color: var(--lp-bg); text-decoration: none;
          transition: background 0.2s, transform 0.15s;
        }
        .landing-cta-sm:hover { background: var(--lp-accent-hover); transform: translateY(-1px); }

        /* ── hero ── */
        .landing-hero {
          position: relative; min-height: 100vh; display: flex; align-items: center;
          justify-content: center; padding: 7rem 1.5rem 5rem; overflow: hidden;
        }
        .landing-hero-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 64px 64px;
          mask-image: radial-gradient(ellipse 60% 50% at 50% 40%, black 20%, transparent 100%);
          -webkit-mask-image: radial-gradient(ellipse 60% 50% at 50% 40%, black 20%, transparent 100%);
        }
        .landing-hero-glow {
          position: absolute; top: -20%; left: 50%; transform: translateX(-50%);
          width: 900px; height: 600px; border-radius: 50%;
          background: radial-gradient(circle, color-mix(in oklch, var(--lp-accent) 12%, transparent) 0%, transparent 70%);
          pointer-events: none;
        }
        .landing-hero-diag {
          position: absolute; bottom: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent 0%, var(--lp-border) 20%, var(--lp-accent) 50%, var(--lp-border) 80%, transparent 100%);
        }
        .landing-hero-content { position: relative; max-width: 760px; text-align: center; }
        .landing-hero-badge {
          display: inline-flex; align-items: center; gap: 0.5rem;
          font-size: 0.8rem; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase;
          color: var(--lp-accent); background: var(--lp-accent-glow);
          border: 1px solid color-mix(in oklch, var(--lp-accent) 24%, transparent); border-radius: 999px;
          padding: 0.4rem 1rem; margin-bottom: 2rem;
        }
        .landing-hero-badge-dot {
          width: 6px; height: 6px; border-radius: 50%; background: var(--lp-accent); flex-shrink: 0;
        }
        .landing-hero-h1 {
          font-size: clamp(2.75rem, 6vw, 5rem); line-height: 1.05; letter-spacing: -0.025em;
          margin-bottom: 1.5rem; color: var(--lp-text); font-style: italic;
        }
        .landing-hero-sub {
          font-size: 1.125rem; line-height: 1.7; color: var(--lp-text-muted);
          max-width: 560px; margin: 0 auto 2.5rem;
        }
        .landing-hero-actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }

        /* ── buttons ── */
        .landing-btn-primary {
          display: inline-flex; align-items: center; gap: 0.5rem;
          font-size: 0.95rem; font-weight: 600; padding: 0.75rem 1.75rem; border-radius: 10px;
          background: var(--lp-accent); color: var(--lp-bg); text-decoration: none;
          transition: background 0.2s, transform 0.15s, box-shadow 0.25s;
          box-shadow: 0 0 0 0 color-mix(in oklch, var(--lp-accent) 0%, transparent);
        }
        .landing-btn-primary:hover {
          background: var(--lp-accent-hover); transform: translateY(-2px);
          box-shadow: 0 8px 32px color-mix(in oklch, var(--lp-accent) 24%, transparent);
        }
        .landing-btn-outline {
          display: inline-flex; align-items: center; gap: 0.5rem;
          font-size: 0.95rem; font-weight: 500; padding: 0.75rem 1.75rem; border-radius: 10px;
          border: 1px solid var(--lp-border); color: var(--lp-text); text-decoration: none;
          transition: border-color 0.2s, background 0.2s;
        }
        .landing-btn-outline:hover { border-color: var(--lp-text-muted); background: rgba(255,255,255,0.03); }

        /* ── sections common ── */
        .landing-section-inner { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; }
        .landing-section-label {
          font-size: 0.75rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--lp-accent); margin-bottom: 0.75rem; text-align: center;
        }
        .landing-section-h2 {
          font-size: clamp(2rem, 4vw, 3.25rem); font-style: italic; line-height: 1.1;
          letter-spacing: -0.02em; text-align: center; margin-bottom: 3.5rem; color: var(--lp-text);
        }

        /* ── features ── */
        .landing-features { padding: 7rem 0; background: var(--lp-bg); }
        .landing-features-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;
        }
        .landing-feature-card {
          background: var(--lp-surface); border: 1px solid var(--lp-border); border-radius: 16px;
          padding: 2rem; transition: border-color 0.3s, transform 0.2s, box-shadow 0.3s;
        }
        .landing-feature-card:hover {
          border-color: color-mix(in oklch, var(--lp-accent) 40%, transparent); transform: translateY(-4px);
          box-shadow: 0 12px 40px color-mix(in oklch, var(--lp-text) 18%, transparent);
        }
        .landing-feature-icon {
          width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;
          border-radius: 12px; background: var(--lp-accent-glow);
          border: 1px solid color-mix(in oklch, var(--lp-accent) 18%, transparent); color: var(--lp-accent); margin-bottom: 1.25rem;
        }
        .landing-feature-title { font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem; }
        .landing-feature-desc { font-size: 0.9rem; line-height: 1.6; color: var(--lp-text-muted); }

        /* ── steps ── */
        .landing-steps { padding: 7rem 0; background: var(--lp-bg); }
        .landing-steps-row {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 2rem;
        }
        .landing-step { position: relative; padding: 2rem; }
        .landing-step-num {
          font-size: 3.5rem; line-height: 1; color: color-mix(in oklch, var(--lp-accent) 18%, transparent); display: block; margin-bottom: 1rem;
        }
        .landing-step-title { font-size: 1.15rem; font-weight: 600; margin-bottom: 0.5rem; }
        .landing-step-desc { font-size: 0.9rem; line-height: 1.6; color: var(--lp-text-muted); }

        /* ── stats ── */
        .landing-stats {
          padding: 5rem 0; background: var(--lp-bg);
          border-top: 1px solid var(--lp-border); border-bottom: 1px solid var(--lp-border);
        }
        .landing-stats-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 2rem; text-align: center;
        }
        .landing-stat-value {
          font-size: 2.75rem; line-height: 1; color: var(--lp-accent);
          display: block; margin-bottom: 0.5rem; font-style: italic;
        }
        .landing-stat-label { font-size: 0.85rem; color: var(--lp-text-muted); letter-spacing: 0.03em; }

        /* ── final CTA ── */
        .landing-final-cta { position: relative; padding: 8rem 0; background: var(--lp-bg); overflow: hidden; }
        .landing-final-cta-glow {
          position: absolute; bottom: -40%; left: 50%; transform: translateX(-50%);
          width: 800px; height: 500px; border-radius: 50%;
          background: radial-gradient(circle, color-mix(in oklch, var(--lp-accent) 10%, transparent) 0%, transparent 70%);
          pointer-events: none;
        }
        .landing-final-cta-inner { position: relative; text-align: center; }
        .landing-final-h2 {
          font-size: clamp(2rem, 4.5vw, 3.5rem); line-height: 1.1; letter-spacing: -0.02em;
          font-style: italic; margin-bottom: 1.25rem;
        }
        .landing-final-sub {
          font-size: 1.05rem; color: var(--lp-text-muted); margin-bottom: 2rem; line-height: 1.6;
        }

        /* ── footer ── */
        .landing-footer { padding: 2rem 0; border-top: 1px solid var(--lp-border); background: var(--lp-bg); }
        .landing-footer-inner {
          max-width: 1200px; margin: 0 auto; padding: 0 1.5rem;
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;
        }
        .landing-footer-logo { font-size: 1.25rem; color: var(--lp-text-muted); font-style: italic; }
        .landing-footer-copy { font-size: 0.8rem; color: var(--lp-text-muted); }

        /* ── noise overlay ── */
        .landing-root::before {
          content: ""; position: fixed; inset: 0; z-index: 100; pointer-events: none; opacity: 0.025;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          background-repeat: repeat; background-size: 256px 256px;
        }

        /* ── responsive ── */
        @media (max-width: 640px) {
          .landing-hero-h1 { font-size: 2.5rem; }
          .landing-hero-sub { font-size: 1rem; }
          .landing-features-grid { grid-template-columns: 1fr; }
          .landing-steps-row { grid-template-columns: 1fr; }
          .landing-stats-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  );
}
