import { FaDiscord, FaInstagram, FaLinkedin } from "react-icons/fa";

const Footer = () => {
  const openCookieSettings = () => {
    const klaro = (window as any).klaro;
    klaro?.show?.((window as any).klaroConfig, true);
  };

  return (
    <footer className="border-t border-border py-8 bg-background">
      <div className="container mx-auto px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

          {/* Logo */}
          <img src="/name_logo.png" alt="Stratosphere logo" className="h-7 object-contain" />

          {/* Social icons */}
          <div className="flex items-center gap-3">
            <a
              href="https://www.instagram.com/stratospheretrading/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-card/50 border border-border hover:bg-card transition-colors"
              aria-label="Instagram"
            >
              <FaInstagram className="w-4 h-4 text-muted-foreground hover:text-[#E4405F]" />
            </a>
            <a
              href="https://www.linkedin.com/company/stratosphere-trading"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-card/50 border border-border hover:bg-card transition-colors"
              aria-label="LinkedIn"
            >
              <FaLinkedin className="w-4 h-4 text-muted-foreground hover:text-[#0077B5]" />
            </a>
            <a
              href="https://discord.com/invite/GMPXtKJh"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-card/50 border border-border hover:bg-card transition-colors"
              aria-label="Discord"
            >
              <FaDiscord className="w-4 h-4 text-muted-foreground hover:text-[#5865F2]" />
            </a>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-6 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Stratosphere. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="/#/privacy"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy Policy
            </a>
            <button
              type="button"
              onClick={openCookieSettings}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cookie Settings
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
