import { createRoot } from "react-dom/client";
import App from "./App";
import { PrivacyPolicyPage } from "@/components/PrivacyPolicyPage";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./index.css";
import OneSignal from "react-onesignal";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
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

    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type === "SW_UPDATED") {
        window.dispatchEvent(new CustomEvent("swUpdateReady"));
      }
    });
  });
}

OneSignal.init({
  appId: "b006b486-0ef4-4219-8135-9d19638e0555",
  allowLocalhostAsSecureOrigin: true,
  serviceWorkerParam: { scope: "/" },
  serviceWorkerPath: "/OneSignalSDKWorker.js",
  notifyButton: {
    enable: false,
  },
  promptOptions: {
    slidedown: {
      prompts: [
        {
          type: "push",
          autoPrompt: false,
          text: {
            actionMessage: "Get notified about new courses and updates for Par for the Course.",
            acceptButton: "Allow",
            cancelButton: "Later",
          },
        },
      ],
    },
  },
}).catch(() => {});

const isPrivacyPage = window.location.pathname === "/privacy";

createRoot(document.getElementById("root")!).render(
  isPrivacyPage ? (
    <ThemeProvider>
      <PrivacyPolicyPage />
    </ThemeProvider>
  ) : (
    <App />
  )
);
