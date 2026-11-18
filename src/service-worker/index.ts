declare const self: ServiceWorkerGlobalScope;

// ── Update flow (P1) ──────────────────────────────────────────────
// The new worker only *announces* itself to open clients.
// The app shows a toast with an "Aktualisieren" action; only when the
// user confirms does the client tell the worker to skip waiting — no
// surprise reloads mid-study.

async function announceUpdateToClients(): Promise<void> {
    // On the very first install there is no previous worker — the update
    // toast (and the client's controllerchange reload) would be wrong.
    if (self.registration.active === null) return;
    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of clients) {
        client.postMessage({ type: "nsc:update-available" });
    }
}

self.addEventListener("install", (event: ExtendableEvent): void => {
    // Activation waits for the user's confirmation via "nsc:skip-waiting"
    // (see the message listener below).
    event.waitUntil(announceUpdateToClients());
});

self.addEventListener("message", (event: ExtendableMessageEvent): void => {
    if ((event.data as { type?: unknown } | null)?.type === "nsc:skip-waiting") {
        event.waitUntil(self.skipWaiting());
    }
});

self.addEventListener("activate", (event: ExtendableEvent): void => {
    // Take control of open clients.
    event.waitUntil(self.clients.claim());
});
