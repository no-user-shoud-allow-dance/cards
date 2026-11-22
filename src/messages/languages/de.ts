import { ErrorCode } from "#lib/core/errors";
import { BOX_COUNT, BOX_ROMANS } from "#lib/core/learning/leitner";
import type { Messages } from "../messages";

/** German (default locale). */
export const de: Messages = {
    errors: {
        [ErrorCode.TITLE_EMPTY]: "Der Titel darf nicht leer sein.",
        [ErrorCode.TITLE_TOO_LONG]: "Der Titel ist zu lang (maximal 100 Zeichen).",
        [ErrorCode.FOLDER_INVALID]: "Der Ordnername darf kein „/“ oder „\\“ enthalten.",
        [ErrorCode.FOLDER_TOO_LONG]: "Der Ordnername ist zu lang (maximal 60 Zeichen).",
        [ErrorCode.FOLDER_RESERVED_PREFIX]:
            "Ordner dürfen nicht mit „#“ beginnen – „#“ ist den Spezial-Ordnern vorbehalten.",
        [ErrorCode.META_VALUE_TOO_LONG]: "Ein Metadaten-Feld ist zu lang.",
        [ErrorCode.SLUG_INVALID]: "Die Stapel-ID ist ungültig.",
        [ErrorCode.PARSE_MISSING_TITLE]: "Keine H1-Überschrift gefunden.",
        [ErrorCode.PARSE_MISSING_SEPARATOR]:
            "Kein „ - “ gefunden – erwartet wird „Vorderseite - Rückseite“.",
        [ErrorCode.PARSE_EMPTY_SIDE]: "Leere Vorder- oder Rückseite.",
        [ErrorCode.PARSE_INVALID_IMAGE_URL]: "Ungültige Bild-URL – nur https:// ist erlaubt.",
        [ErrorCode.PARSE_TOO_MANY_IMAGES]: "Mehr als ein Bild pro Karte – nur eines erlaubt.",
        [ErrorCode.PARSE_UNTERMINATED_FRONTMATTER]:
            "Der Metadaten-Block („--- … ---“) ist nicht abgeschlossen.",
        [ErrorCode.PARSE_UNKNOWN_DECK_TYPE]:
            "Unbekannter Stapeltyp – erlaubt sind „latin“, „greek“, „english“.",
        [ErrorCode.PARSE_TAG_TOO_LONG]: "Ein Tag ist zu lang (maximal 24 Zeichen).",
        [ErrorCode.SPAN_INVALID]: "Ungültige Textformatierung.",
        [ErrorCode.HINT_INVALID]: "Ungültiger Hinweis-Bereich.",
        [ErrorCode.EPOCH_INVALID]: "Ungültiger Zeitstempel.",
        [ErrorCode.BOX_OUT_OF_RANGE]: "Ungültige Box.",
        [ErrorCode.EMPTY_ARRAY]: "Die Liste darf nicht leer sein.",
        [ErrorCode.LINK_UNKNOWN_KIND]: "Unbekannter Link-Typ.",
        [ErrorCode.LINK_INVALID_ENCODING]: "Der Link ist beschädigt oder ungültig.",
        [ErrorCode.LINK_PAYLOAD_TOO_LARGE]:
            "Der Stapel ist zu groß für einen Link – bitte als Server-Link teilen.",
        [ErrorCode.LINK_BAD_SHAPE]: "Der Link enthält ungültige Daten.",
        [ErrorCode.SHARE_ID_INVALID]: "Die Server-Link-ID ist ungültig.",
        [ErrorCode.SHARE_KEY_INVALID]: "Der Server-Link-Schlüssel ist ungültig.",
        [ErrorCode.SHARE_UNSUPPORTED_CIPHER]:
            "Dieses Verschlüsselungsformat wird nicht unterstützt.",
        [ErrorCode.SHARE_DECRYPT_FAILED]:
            "Entschlüsselung fehlgeschlagen – Link oder Schlüssel ist falsch.",
        [ErrorCode.SESSION_EMPTY]: "Keine Karten in dieser Lernrunde.",
        [ErrorCode.SESSION_NOT_IN_PROGRESS]: "Die Lernrunde ist nicht aktiv.",
    },

    UI: {
        deck: "Stapel",
        card: "Karte",
        cardsSeen: (seen, total) => `${seen}/${total} Karten gesehen`,
        overviewSeen: "In der Übersicht gesehen",
        learnedOf: (learned, total) => `${learned}/${total} gelernt`,
        overview: "Überblick",
        cramSession: "Lernrunde",
        box: "Box",
        lapse: "Fehler",
        streak: (n) => `Serie: ${n} richtige Antworten`,
        hint: "Hinweis",
        context: "Kontext",
        tags: "Tags",
        deckType: "Stapeltyp",
        continueLearning: "Weiter lernen",
        hideFromContinue: "Aus »Weiter lernen« ausblenden",
        showInContinue: "Wieder in »Weiter lernen« anzeigen",
        excludedFromContinue: "Aus »Weiter lernen« ausgeblendet",
        pin: "Anheften",
        unpin: "Lösen",
        deckHasErrors:
            "Dieser Stapel enthält Fehler – Teilen und Drucken sind erst nach der Behebung möglich.",
        draftAllCards: "Alle Karten",
        draftNoCards: "Dieser Stapel enthält noch keine Karten.",
        saveDraft: "Entwurf speichern",
        saveDraftBody: "Wähle einen Ordner, in dem der Stapel gespeichert werden soll.",
        newFolder: "Neuer Ordner",
        newFolderName: "Name des neuen Ordners",
        pairing: "Geräte koppeln",
        host: "Host",
        join: "Beitreten",
        serverLink: "Server-Link",
        moonButton: "Schlafen legen",
        mooned: "Diese Karte schläft jetzt.",
        wake: "Aufwecken",
        moonBox: "Mond-Box",
        pairingConsentTitle: "Wirklich mit diesem Gerät verbinden?",
        pairingConsentBody:
            "Nur verbinden, wenn du den Link selbst erzeugt hast. Ein fremder Link kann Geräte koppeln, die sich gegenseitig alle Stapel schicken.",
        pairingConsentConfirm: "Ja, verbinden",
        pairingConsentCancel: "Abbrechen",
        importTitle: "Stapel importieren",
        progressNoDeck: "Kein Stapel mit passendem Inhalt für diesen Fortschritt gefunden.",
        shareDeck: "Stapel teilen",
        syncProgress: "Synchronisieren",
        both: "Beides",
        loadingDecks: "Stapel werden geladen …",
        loadingDeck: "Stapel wird geladen …",
        busySaving: "Wird gespeichert …",
        busyDecrypting: "Wird entschlüsselt …",
        busyCreating: "Wird angelegt …",
        busyEncrypting: "Wird verschlüsselt …",
        boxLabel: (box) => (box >= BOX_COUNT ? "Gelernt" : (BOX_ROMANS[box - 1] ?? String(box))),
        countCards: (n) =>
            n === 0
                ? "Keine Karten"
                : `${n} ${new Intl.PluralRules("de").select(n) === "one" ? "Karte" : "Karten"}`,
        studyTime: (ms) => {
            const totalSeconds = Math.round(ms / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            if (hours > 0) return `${hours} Std ${minutes} Min`;
            if (minutes > 0) return `${minutes} Min ${seconds} Sek`;
            return `${seconds} Sek`;
        },
        deckTypeLabel: (type) =>
            type === "greek" ? "Altgriechisch" : type === "latin" ? "Latein" : "Englisch",
        deckTypeLanguage: (type) =>
            type === "greek" ? "Altgriechischen" : type === "latin" ? "Lateinischen" : "Englischen",
        helpSearchQuery: (answer, language, prompt) =>
            `"${answer}" im Kontext im Deutschen und Vergleich mit Beispielen? ` +
            `Und wie ist der Fall, wenn es um die Übersetzung aus dem ${language} ` +
            `"${prompt}" geht (auch mit Beispielen)?`,
        mnemonicSearchQuery: (prompt) =>
            `"${prompt}" Mnemotechnik oder verwandte Wörter in anderen Sprachen`,
        draftName: (n) => `Draft-${n}`,
        pureMode: "Pur-Modus",
        pureModeDefault: "Pur-Modus – Standard für neue Stapel",
        languageSection: "Sprache",
        languageDe: "Deutsch",
        languageEn: "English",
        printCard: "Karte",
        printNumber: "Nr.",
        printFront: "Vorderseite",
        printBack: "Rückseite",
        printContext: "Kontext",
        printImage: "Bild",
        printLearnField: "Lernfeld",
        boxCountsAria: "Karten pro Box",
        heroTitle: "Lernen, das bleibt.",
        heroText:
            "NSC ist dein Karteikasten fürs Vokabellernen – lokal auf diesem Gerät, ohne Konto, mit Spaced Repetition nach Leitner.",
        heroCardBack: "(zu) lernen",
        heroFlipHint: "Karte umdrehen",
        foldersHeading: "Ordner",
        foldersSubtitle: "Wähle einen Stapel zum Lernen.",
        createDeck: "Stapel erstellen",
        docsCardTitle: "Dokumentation",
        docsCardText:
            "So funktioniert NSC – einfach erklärt, inklusive technischem Hintergrund für Entwickler:innen.",
        emptyHome: "Keine Stapel gefunden.",
        emptyHomeAction: "Lade einen eigenen Stapel hoch",
        emptyDeck: "Dieser Stapel enthält keine Karten.",
        emptyNoCards: "Keine Karten verfügbar.",
        editorSourceLabel: "Markdown",
        editorPreviewLabel: "Vorschau",
        errorsCount: (n) => `${n} Fehler`,
        pureModeState: (on) => (on ? "an" : "aus"),
        saveAction: "Speichern",
        folderChooseTitle: "Ordner wählen",
        folderChooseHint: (deckName) =>
            `Der Stapel „${deckName}“ wird in diesem Ordner gespeichert.`,
        folderInputLabel: "Ordner",
        backToEditor: "Zurück zum Editor",
        saveBlocked: "Der Stapel enthält noch Fehler – bitte zuerst beheben.",
        saveFailed: "Der Stapel konnte nicht gespeichert werden.",
        sectionLearning: "Lernstand",
        sectionSyncSettings: "Sync & Einstellungen",
        editorSourceAria: "Stapel-Markdown bearbeiten",
        editorPreviewAria: "Vorschau",
        formatAction: "Formatieren",
        formatTitle: "Markdown formatieren (Leerzeilen um den Titel, Leerzeichen am Zeilenende)",
        updateAvailable: "Neue Version verfügbar",
        updateAction: "Aktualisieren",
    },

    MIGRATION: {
        title: "Migration – NSC",
        running: "Deine Daten aus Version 1 werden übernommen – einen Moment bitte.",
        failedTitle: "Übernahme fehlgeschlagen",
        failedText:
            "Deine Daten aus Version 1 konnten leider nicht übernommen werden. Sie bleiben lokal gespeichert und werden nicht gelöscht.",
        continueAction: "Weiter",
    },

    SYNC: {
        peerUnreachable: "Das andere Gerät ist nicht erreichbar – läuft dort der Host-Modus?",
        signalingFailed:
            "Verbindung zum Signalisierungs-Server fehlgeschlagen – bitte Netzwerk prüfen.",
        idTaken: "Diese Peer-ID ist bereits vergeben – bitte erneut versuchen.",
        connectionFailed: "Verbindung fehlgeschlagen.",
        applied: (added, merged) => `applied: ${added} neue Stapel, ${merged} zusammengeführt`,
        doneOne: "Sync fertig – 1 neuer Stapel.",
        doneMany: (count) => `Sync fertig – ${count} neue Stapel.`,
        packageInvalid: "Sync-Paket ungültig.",
        invalidPeerId: "Ungültige Peer-ID.",
    },

    SHARE: {
        badRequest: "Ungültige Anfrage.",
        linkExpired: "Link abgelaufen.",
        tooManyRequests: "Zu viele Anfragen – bitte später erneut versuchen.",
        notConfigured: "Server-Links sind auf diesem Server nicht eingerichtet.",
        serverError: (status) => `Server-Fehler (HTTP ${status}).`,
        networkError: "Netzwerkfehler – bist du online?",
        invalidResponse: "Ungültige Server-Antwort.",
        decryptFailed: "Schlüssel falsch oder Daten beschädigt.",
        linkDamaged: "Der Link ist ungültig oder beschädigt.",
    },
};
