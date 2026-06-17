// Klaro consent manager configuration
// Docs: https://klaro.org/docs/getting-started

export const klaroConfig = {
  version: 1,
  elementID: "klaro",
  storageMethod: "localStorage" as const,
  storageName: "klaro-consent",
  cookieExpiresAfterDays: 365,
  htmlTexts: true,
  embedded: false,
  groupByPurpose: true,
  default: false,
  mustConsent: false,
  acceptAll: true,
  hideDeclineAll: false,
  hideLearnMore: false,
  noticeAsModal: false,

  // Link to privacy policy (required by GDPR)
  privacyPolicy: "/#/privacy",

  translations: {
    en: {
      consentModal: {
        title: "Privacy & Cookies",
        description:
          "We use cookies and similar technologies to understand how you use Stratosphere and to improve the product. Analytics cookies are optional — you can accept or decline below. See our <a href='/#/privacy'>privacy policy</a> for details.",
      },
      consentNotice: {
        description:
          "We use optional analytics cookies to improve Stratosphere. {purposes} Learn more in our <a href='/#/privacy'>privacy policy</a>.",
      },
      purposes: {
        analytics: {
          title: "Analytics",
          description:
            "Helps us understand how visitors use the site so we can improve it.",
        },
      },
      "google-analytics": {
        title: "Google Analytics 4",
        description:
          "Anonymous usage analytics (page views, session duration). Data is processed by Google.",
      },
      ok: "Accept all",
      decline: "Decline",
      acceptSelected: "Save preferences",
      acceptAll: "Accept all",
      service: {
        purpose: "Purpose",
        purposes: "Purposes",
      },
    },
  },

  purposes: ["analytics"],

  services: [
    {
      name: "google-analytics",
      default: false,
      title: "Google Analytics 4",
      purposes: ["analytics"],
      cookies: [[/^_ga/, "/", ".mamizm.com"], /^_ga/, /^_gid/, /^_gat/],
      // Fires on consent change — wires into Google Consent Mode v2
      callback: (consent: boolean) => {
        const w = window as any;
        if (typeof w.gtag === "function") {
          w.gtag("consent", "update", {
            analytics_storage: consent ? "granted" : "denied",
            ad_storage: consent ? "granted" : "denied",
            ad_user_data: consent ? "granted" : "denied",
            ad_personalization: consent ? "granted" : "denied",
          });
        }
      },
      required: false,
      optOut: false,
      onlyOnce: true,
    },
  ],
};
