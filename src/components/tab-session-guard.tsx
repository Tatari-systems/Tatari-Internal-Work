"use client";

import { useEffect, useState, type ReactNode } from "react";

import {
  claimTabHandshake,
  expireAuthSession,
} from "@/lib/auth/tab-session-actions";
import { TAB_CHANNEL, TAB_STORAGE_KEY } from "@/lib/auth/tab-session";

function pingOpenTabs(): Promise<boolean> {
  if (typeof BroadcastChannel === "undefined") {
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    const channel = new BroadcastChannel(TAB_CHANNEL);
    let answered = false;

    channel.onmessage = (event) => {
      if (event.data?.type === "pong") {
        answered = true;
      }
    };

    channel.postMessage({ type: "ping" });
    window.setTimeout(() => {
      channel.close();
      resolve(answered);
    }, 200);
  });
}

function listenForSiblingTabs() {
  if (typeof BroadcastChannel === "undefined") {
    return () => undefined;
  }

  const channel = new BroadcastChannel(TAB_CHANNEL);
  channel.onmessage = (event) => {
    if (event.data?.type === "ping") {
      channel.postMessage({ type: "pong" });
    }
  };

  return () => channel.close();
}

export function TabSessionGuard({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let stopListening: () => void = () => undefined;

    async function admit() {
      if (sessionStorage.getItem(TAB_STORAGE_KEY) === "1") {
        return true;
      }

      const handshake = await claimTabHandshake();
      if (handshake.ok) {
        sessionStorage.setItem(TAB_STORAGE_KEY, "1");
        return true;
      }

      if (await pingOpenTabs()) {
        sessionStorage.setItem(TAB_STORAGE_KEY, "1");
        return true;
      }

      await expireAuthSession();
      return false;
    }

    void admit().then((ok) => {
      if (cancelled) {
        return;
      }

      if (!ok) {
        window.location.replace("/login?session=expired");
        return;
      }

      stopListening = listenForSiblingTabs();
      setReady(true);
    });

    return () => {
      cancelled = true;
      stopListening();
    };
  }, []);

  if (!ready) {
    return <div className="min-h-screen bg-bg" />;
  }

  return children;
}
