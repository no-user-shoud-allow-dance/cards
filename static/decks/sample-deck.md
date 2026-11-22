---
type: latin
author: NSC Beispiel
description: Alle Funktionen des Deck-Formats auf einen Blick
source: https://nsc.example/beispiel
---

# Beispiel: Lateinische Vokabeln

// Kommentarzeilen beginnen mit // und tauchen nirgends auf

// Eine Karte pro Zeile: Vorderseite - Rückseite
// Das erste „ - “ trennt; die Rückseite darf selbst „ - “ enthalten.
amo - ich liebe
veni, vidi, vici - ich kam - ich sah - ich siegte

// Kontext (Beispielsatz unter der Antwort) nach ::
amo - ich liebe :: Amo, amas, amat.

// Tags mit # am Zeilenende (mehrere möglich)
amas - du liebst #verb
amat - er/sie/es liebt #verb #konsonantisch

// Mond * am Zeilenende: blendet die Karte aus jeder Lernrunde aus
civis - der Bürger, die Bürgerin *

// Hinweise in eckigen Klammern – auch mehrere pro Seite, Vorder- und Rückseite
amor [Liebe] [Zuneigung] - die Liebe
amo [amare] - ich liebe [to love]

// Formatierung im Text (auch verschachtelt)
vocare - **rufen** (Infinitiv)
amicus - der _Freund_ (m.)
sum - `ich bin`
amare - ++lieben++
errare - ~~irren~~
humanum est - ==menschlich==
E = mc^2^ - Energie
H~2~O - Wasser

// Bild am Zeilenende: ![alt](https://…) – nur https://, max. eines pro Karte, auf beiden Seiten
nummus - die Münze ![Münze](https://hosting.example/muenze.jpg)
porta - das Tor, die Tür ![Tor](https://hosting.example/tor.jpg)

// Mehrzeilig: \n (Backslash-n) wird zu einem echten Zeilenumbruch
poeta - der Dichter\nGenitiv: poetae

// Alles kombiniert: Kontext + Tags + Bild (vor dem Mond) + Mond
amo - ich liebe :: Amo, amas, amat. #verb #beispiel ![Herz](https://hosting.example/herz.jpg) *
