import { useEffect } from "react";
import { useLocation, Outlet } from "react-router-dom";

const isLocalhost = ["localhost", "127.0.0.1"].includes(
  window.location.hostname,
);

const trackPageView = (url: string) => {
  if (isLocalhost) return;

  // Only fire GA4 if Klaro has recorded user consent for google-analytics.
  const klaro = (window as any).klaro;
  const manager = klaro?.getManager?.();
  const hasConsent = manager?.getConsent?.("google-analytics");

  if (hasConsent) {
    (window as any).gtag?.("event", "page_view", { page_path: url });
  }
};

const RouteTracker = () => {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location]);

  return <Outlet />;
};

export default RouteTracker;
