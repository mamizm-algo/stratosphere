// Simple placeholder privacy policy — replace with legally reviewed content before launch.

import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  const openCookieSettings = () => {
    const klaro = (window as any).klaro;
    klaro?.show?.((window as any).klaroConfig, true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-accent bg-card backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <img
              src="/name_logo.png"
              alt="Stratosphere logo"
              className="h-8 object-contain"
            />
          </div>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-6 py-16 max-w-3xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/20">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Privacy Policy
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mb-12">
          Last updated: {new Date().toISOString().slice(0, 10)}
        </p>

        <div className="space-y-8">
          <div className="bg-card border border-primary/30 rounded-xl p-5">
            <p className="text-muted-foreground text-sm">
              This is a placeholder privacy policy for Stratosphere. It will be
              replaced with a full, legally reviewed policy before public
              launch.
            </p>
          </div>

          <Section title="1. Who we are">
            <p>
              Stratosphere ("we", "us") provides trading pattern analytics
              tools. You can reach us at{" "}
              <a
                href="mailto:hello@mamizm.com"
                className="text-primary hover:underline"
              >
                hello@mamizm.com
              </a>
              .
            </p>
          </Section>

          <Section title="2. What data we collect">
            <ul className="space-y-3 list-none">
              <Li>
                <strong className="text-foreground">Analytics data</strong>{" "}
                <span className="text-muted-foreground">
                  (only with your consent)
                </span>
                : page views, session duration, approximate location, device and
                browser type — collected via Google Analytics 4.
              </Li>
              <Li>
                <strong className="text-foreground">Technical data</strong>:
                standard server logs (IP address, user agent) used for security
                and debugging.
              </Li>
            </ul>
          </Section>

          <Section title="3. Cookies">
            <p className="mb-4">
              We use the following cookies only after you accept them in the
              cookie banner:
            </p>
            <div className="bg-background rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                      Cookie
                    </th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                      Provider
                    </th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                      Expires
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50">
                    <td className="px-4 py-3 font-mono text-xs text-primary">
                      _ga
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      Google Analytics
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">2 years</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs text-primary">
                      _ga_G-86PG8M6P33
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      Google Analytics
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">2 years</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4">
              You can change your choice at any time:{" "}
              <button
                type="button"
                onClick={openCookieSettings}
                className="text-primary hover:underline"
              >
                Manage cookie settings
              </button>
              .
            </p>
          </Section>

          <Section title="4. Legal basis (GDPR)">
            <p>
              We process analytics data on the basis of your consent (Art.
              6(1)(a) GDPR). You may withdraw consent at any time without
              affecting prior processing.
            </p>
          </Section>

          <Section title="5. Data sharing">
            <p>
              Analytics data is processed by Google LLC (USA) under their Data
              Processing Terms. We do not sell personal data.
            </p>
          </Section>

          <Section title="6. Your rights">
            <p>
              You have the right to access, correct, delete, or export your
              personal data, and to lodge a complaint with your local data
              protection authority. Email{" "}
              <a
                href="mailto:hello@mamizm.com"
                className="text-primary hover:underline"
              >
                hello@mamizm.com
              </a>{" "}
              to exercise these rights.
            </p>
          </Section>

          <Section title="7. Changes">
            <p>
              We may update this policy. Significant changes will be announced
              on this page.
            </p>
          </Section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-8">
        <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Stratosphere. All rights reserved.
          </p>
          <button
            type="button"
            onClick={openCookieSettings}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cookie Settings
          </button>
        </div>
      </footer>
    </div>
  );
};

// ── Layout helpers ──────────────────────────────────────────────────────────

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section>
    <h2 className="text-lg font-semibold text-foreground mb-3 pb-2 border-b border-border">
      {title}
    </h2>
    <div className="text-muted-foreground leading-relaxed space-y-2">
      {children}
    </div>
  </section>
);

const Li = ({ children }: { children: React.ReactNode }) => (
  <li className="flex gap-2">
    <span className="text-primary mt-1 shrink-0">•</span>
    <span>{children}</span>
  </li>
);

export default PrivacyPolicy;
