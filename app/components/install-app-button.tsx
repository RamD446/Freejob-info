"use client";

import { Download } from "lucide-react";
import { useEffect, useState } from "react";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export default function InstallAppButton() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    function captureInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    }

    function markInstalled() {
      setInstallPrompt(null);
      setMessage("App installed.");
    }

    window.addEventListener("beforeinstallprompt", captureInstallPrompt);
    window.addEventListener("appinstalled", markInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", captureInstallPrompt);
      window.removeEventListener("appinstalled", markInstalled);
    };
  }, []);

  async function installApp() {
    if (!installPrompt) {
      const isAppleMobile = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      setMessage(isAppleMobile
        ? "Open the Share menu, then choose Add to Home Screen."
        : "Open your browser menu and choose Install app or Add to Home screen.");
      return;
    }

    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      setMessage(choice.outcome === "accepted" ? "App installed." : "");
    } catch {
      setMessage("Open your browser menu and choose Install app or Add to Home screen.");
    } finally {
      setInstallPrompt(null);
    }
  }

  return (
    <div className="footer-install-wrap">
      <button className="footer-install-button" onClick={installApp} type="button">
        <Download size={15} aria-hidden="true" />
        Install app
      </button>
      {message ? <span className="footer-install-message" role="status">{message}</span> : null}
    </div>
  );
}