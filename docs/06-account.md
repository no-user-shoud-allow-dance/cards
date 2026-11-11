---
title: Konto, Sync und Daten löschen
description: Statistik und lokale Speicher auf einen Blick, zwei Geräte direkt synchronisieren und alle Daten löschen.
icon: "/icons/docs/06-account.svg"
---

Die **Konto-Seite** erreichst du über das Zahnrad oben rechts im Header — ohne Server, alle Daten bleiben auf diesem Gerät.

## Statistik

Ein Tortendiagramm zeigt, wie sich deine Karten auf die Leitner-Boxen verteilen — Box VI (gelernt) ist grün hervorgehoben, Karten ohne abgeschlossene Übersicht zählen als „In Übersicht“. Darunter: Anzahl Stapel, Karten, gelernt, abgeschlossene Übersichten und die gesamte Lernzeit.

## Lokale Speicher

Die Seite listet transparent auf, was die App lokal abgelegt hat: Fortschritt, Übersicht-Status, Lernzeit, Timer, Einstellungen und Toast-Quittungen im Local Storage (Schlüssel-Präfix `kk_`) sowie die Stapel inklusive Roh-Markdown in der IndexedDB (`nsc-user-decks`). Der Mistral-API-Schlüssel wird nie im Klartext angezeigt, sondern nur „gesetzt“ bzw. „leer“.

## Geräte synchronisieren

Unter „Synchronisieren“ verbindest du zwei eigene Geräte direkt miteinander — im Kapitel [Teilen und Synchronisieren](/docs/04-teilen-und-sync) beschrieben: „Als Host öffnen“ zeigt die Peer-ID (`nsc-…`) als Text und QR-Code, das zweite Gerät scannt oder tippt sie ein („Peer-ID des anderen Geräts“). Danach tauschen die Geräte alle Stapel und den Fortschritt verschlüsselt per WebRTC aus.

## Alle Daten löschen

„Alle Daten löschen“ entfernt nach einer Sicherheitsabfrage alle `kk_`-Einträge im Local Storage, den Session-Speicher und die komplette IndexedDB — danach startet die App leer neu. Fortschritt und Stapel sind dann unwiderruflich weg.
