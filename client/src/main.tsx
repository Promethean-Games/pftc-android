import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        // Detect when a new SW installs while the page is open
        reg.addEventListener("updatefound", () => {
          const incoming = reg.installing;
          if (!incoming) return;
          incoming.addEventListener("statechange", () => {
            if (
              incoming.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              window.dispatchEvent(new CustomEvent("swUpdateReady"));
            }
          });
        });
      })
      .catch(() => {});

    // Detect when the SW activates after the page was already open
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type === "SW_UPDATED") {
        window.dispatchEvent(new CustomEvent("swUpdateReady"));
      }
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
