---
title: Teilen und Synchronisieren
description: Stapel als Link oder QR-Code teilen und zwei Geräte direkt miteinander syncen.
icon: "/icons/docs/04-teilen-und-sync.svg"
---

## Stapel teilen

Auf der Export-Seite eines Stapels bekommst du:

- einen **Link**, der den ganzen Stapel enthält — wahlweise nur den Stapel, nur deinen Fortschritt oder beides,
- einen **QR-Code** zum schnellen Teilen auf ein anderes Gerät.

Die Daten stecken komprimiert in der URL hinter dem `#`. Dieser Teil wird nie an einen Server geschickt — er bleibt in deinem Browser. Jeder, der den Link hat, kann den Inhalt lesen; teile ihn also nur mit Personen, die ihn sehen dürfen. Beim Öffnen importierst du den Stapel mit einem Klick, per QR-Scan oder per Link.

**Zu groß für einen QR-Code?** Dann bietet die Export-Seite einen **verschlüsselten Server-Link** (`/s/…#k.…`): Der Stapel wird lokal mit AES-256-GCM verschlüsselt hochgeladen, und der Schlüssel steckt ausschließlich im `#k.…`-Fragment des Links — das Fragment wird nie an den Server gesendet. Der Server (Vercel KV) speichert nur das Chiffrat, 2 Tage lang. Der entstehende Link ist kurz genug für jeden QR-Code. Beachte: Alles, was die volle URL protokolliert, kann den Schlüssel preisgeben — behandle den Link wie ein Passwort. Details in der Datenschutzerklärung.

## Zwei Geräte synchronisieren

Auf der Konto-Seite kannst du zwei deiner Geräte direkt miteinander verbinden:

1. Auf dem ersten Gerät startest du den **Host-Modus** — die App zeigt eine Peer-ID als Text und QR-Code an.
2. Auf dem zweiten Gerät scannst du den QR-Code (oder fügst die ID ein) und verbindest.
3. Beide Geräte tauschen ihre Daten aus: alle Stapel und der Lernfortschritt.

**Datenschutz dabei:** Beim Verbindungsaufbau hilft kurz ein Signalisierungs-Server (PeerJS) — er sieht nur Verbindungsdaten wie die IP-Adresse, niemals Inhalte. Danach läuft die Übertragung direkt zwischen den beiden Geräten, verschlüsselt über WebRTC. Die Peer-ID (Format `nsc-…`) ist der einzige Zugangsschlüssel. Duplikate werden am Inhalts-Hash erkannt, beim Fortschritt gewinnt die höhere Box; die Lernzeit bleibt auf jedem Gerät lokal. Details stehen in der Datenschutzerklärung im Footer.
