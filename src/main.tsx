import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Klaro cookie consent
import * as Klaro from "klaro";
import "klaro/dist/klaro.css";
import { klaroConfig } from "./lib/klaro-config";

// Skip Klaro (and GA4) entirely on localhost — no analytics data in dev.
const isLocalhost = ["localhost", "127.0.0.1"].includes(
  window.location.hostname,
);
if (!isLocalhost) {
  (window as any).klaro = Klaro;
  (window as any).klaroConfig = klaroConfig;
  Klaro.setup(klaroConfig as any);
}

createRoot(document.getElementById("root")!).render(<App />);
