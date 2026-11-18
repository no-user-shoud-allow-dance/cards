import { type ErrorCode as ErrorCodeType } from "#lib/core/errors";
import type { DeckType } from "#lib/core/deck/document";

/**
 * The message-layer contract: every user-facing string lives in exactly
 * one locale file typed as `Messages`, so TypeScript enforces that de
 * and en have identical keys (tests/messages.test.ts deep-compares them).
 *
 * UI wording follows the terminology table in ARCHITECTURE.md — no
 * synonyms per concept. Error sentences are keyed by error code; the
 * `Record<ErrorCode, string>` table makes a code without a message a
 * compile error.
 */

export interface Messages {
    /** Every error code → its sentence. Exhaustive by type. */
    errors: Record<ErrorCodeType, string>;
    UI: {
        deck: string;
        card: string;
        cardsSeen: (seen: number, total: number) => string;
        /** Segment label: cards seen in the overview, not yet answered. */
        overviewSeen: string;
        /** "3/12 gelernt" — learned-count label on progress surfaces. */
        learnedOf: (learned: number, total: number) => string;
        overview: string;
        cramSession: string;
        box: string;
        lapse: string;
        streak: (n: number) => string;
        hint: string;
        context: string;
        tags: string;
        deckType: string;
        continueLearning: string;
        hideFromContinue: string;
        showInContinue: string;
        excludedFromContinue: string;
        pin: string;
        unpin: string;
        deckHasErrors: string;
        draftAllCards: string;
        draftNoCards: string;
        saveDraft: string;
        saveDraftBody: string;
        newFolder: string;
        newFolderName: string;
        pairing: string;
        host: string;
        join: string;
        serverLink: string;
        moonButton: string;
        mooned: string;
        wake: string;
        moonBox: string;
        pairingConsentTitle: string;
        pairingConsentBody: string;
        pairingConsentConfirm: string;
        pairingConsentCancel: string;
        importTitle: string;
        /** Progress-Share-Link ohne lokalen Stapel mit passendem Inhalt. */
        progressNoDeck: string;
        shareDeck: string;
        syncProgress: string;
        both: string;
        loadingDecks: string;
        loadingDeck: string;
        busySaving: string;
        busyDecrypting: string;
        busyCreating: string;
        busyEncrypting: string;
        /** Box label: roman numeral I–V, the last box is the learned label. */
        boxLabel: (box: number) => string;
        /** Plural-aware "1 Karte" / "n Karten". */
        countCards: (n: number) => string;
        /** Duration label for study-time displays. */
        studyTime: (ms: number) => string;
        deckTypeLabel: (type: DeckType) => string;
        /** Genitive of the source language, used in help-search queries. */
        deckTypeLanguage: (type: DeckType) => string;
        /** Google help-search query (context + translation) for a card. */
        helpSearchQuery: (answer: string, language: string, prompt: string) => string;
        /** Google mnemonic-search query for a card. */
        mnemonicSearchQuery: (prompt: string) => string;
        /** Draft deck name pattern (proper noun in both locales). */
        draftName: (n: number) => string;
        pureMode: string;
        pureModeDefault: string;
        languageSection: string;
        languageDe: string;
        languageEn: string;
        printCard: string;
        printNumber: string;
        printFront: string;
        printBack: string;
        printContext: string;
        printImage: string;
        printLearnField: string;
        /** Aria label for the box strip / box overview. */
        boxCountsAria: string;
        /** Home hero (H2): welcome line, subline, flip hint. */
        heroTitle: string;
        heroText: string;
        heroCardBack: string;
        heroFlipHint: string;
        /** Home hierarchy (H4) + docs card. */
        foldersHeading: string;
        foldersSubtitle: string;
        createDeck: string;
        docsCardTitle: string;
        docsCardText: string;
        /** Empty states (H17). */
        emptyHome: string;
        emptyHomeAction: string;
        emptyDeck: string;
        emptyNoCards: string;
        /** Editor seams (H14): pane labels, save flow, error count. */
        editorSourceLabel: string;
        editorPreviewLabel: string;
        errorsCount: (n: number) => string;
        pureModeState: (on: boolean) => string;
        saveAction: string;
        folderChooseTitle: string;
        folderChooseHint: (deckName: string) => string;
        folderInputLabel: string;
        backToEditor: string;
        saveBlocked: string;
        saveFailed: string;
        /** Account desk section labels (H11). */
        sectionLearning: string;
        sectionSyncSettings: string;
        editorSourceAria: string;
        editorPreviewAria: string;
        formatAction: string;
        formatTitle: string;
        /** Service-worker update toast (P1). */
        updateAvailable: string;
        updateAction: string;
    };
    /** Device-pairing (sync) wording and error sentences. */
    SYNC: {
        peerUnreachable: string;
        signalingFailed: string;
        idTaken: string;
        connectionFailed: string;
        applied: (added: number, merged: number) => string;
        doneOne: string;
        doneMany: (count: number) => string;
        packageInvalid: string;
        invalidPeerId: string;
    };
    /** Server-link (encrypted share) error sentences. */
    SHARE: {
        badRequest: string;
        linkExpired: string;
        tooManyRequests: string;
        notConfigured: string;
        serverError: (status: number) => string;
        networkError: string;
        invalidResponse: string;
        decryptFailed: string;
        linkDamaged: string;
    };
}
