import { ErrorCode } from "#lib/core/errors";
import { BOX_COUNT, BOX_ROMANS } from "#lib/core/learning/leitner";
import type { Messages } from "../messages";

/**
 * English locale — must have exactly the same keys as `de` (enforced by
 * the `Messages` type and deep-compared by tests/messages.test.ts).
 */
export const en: Messages = {
    errors: {
        [ErrorCode.TITLE_EMPTY]: "The title must not be empty.",
        [ErrorCode.TITLE_TOO_LONG]: "The title is too long (100 characters max).",
        [ErrorCode.FOLDER_INVALID]: "The folder name must not contain “/” or “\\”.",
        [ErrorCode.FOLDER_TOO_LONG]: "The folder name is too long (60 characters max).",
        [ErrorCode.FOLDER_RESERVED_PREFIX]:
            "Folder names must not start with “#” – “#” is reserved for special folders.",
        [ErrorCode.META_VALUE_TOO_LONG]: "A metadata field is too long.",
        [ErrorCode.SLUG_INVALID]: "The deck ID is invalid.",
        [ErrorCode.PARSE_MISSING_TITLE]: "No H1 heading found.",
        [ErrorCode.PARSE_MISSING_SEPARATOR]: "No “ - ” found – expected “front - back”.",
        [ErrorCode.PARSE_EMPTY_SIDE]: "Empty front or back side.",
        [ErrorCode.PARSE_INVALID_IMAGE_URL]: "Invalid image URL – only https:// is allowed.",
        [ErrorCode.PARSE_TOO_MANY_IMAGES]: "More than one image per card – only one allowed.",
        [ErrorCode.PARSE_UNTERMINATED_FRONTMATTER]:
            "The metadata block (“--- … ---”) is not terminated.",
        [ErrorCode.PARSE_UNKNOWN_DECK_TYPE]:
            "Unknown deck type – allowed are “latin”, “greek”, “english”.",
        [ErrorCode.PARSE_TAG_TOO_LONG]: "A tag is too long (24 characters max).",
        [ErrorCode.SPAN_INVALID]: "Invalid text formatting.",
        [ErrorCode.HINT_INVALID]: "Invalid hint section.",
        [ErrorCode.EPOCH_INVALID]: "Invalid timestamp.",
        [ErrorCode.BOX_OUT_OF_RANGE]: "Invalid box.",
        [ErrorCode.EMPTY_ARRAY]: "The list must not be empty.",
        [ErrorCode.LINK_UNKNOWN_KIND]: "Unknown link type.",
        [ErrorCode.LINK_INVALID_ENCODING]: "The link is damaged or invalid.",
        [ErrorCode.LINK_PAYLOAD_TOO_LARGE]:
            "The deck is too large for a link – please share it as a server link.",
        [ErrorCode.LINK_BAD_SHAPE]: "The link contains invalid data.",
        [ErrorCode.SHARE_ID_INVALID]: "The server-link ID is invalid.",
        [ErrorCode.SHARE_KEY_INVALID]: "The server-link key is invalid.",
        [ErrorCode.SHARE_UNSUPPORTED_CIPHER]: "This encryption format is not supported.",
        [ErrorCode.SHARE_DECRYPT_FAILED]: "Decryption failed – link or key is wrong.",
        [ErrorCode.SESSION_EMPTY]: "No cards in this study session.",
        [ErrorCode.SESSION_NOT_IN_PROGRESS]: "The study session is not active.",
    },

    UI: {
        deck: "Deck",
        card: "Card",
        cardsSeen: (seen, total) => `${seen}/${total} cards seen`,
        overviewSeen: "Seen in the overview",
        learnedOf: (learned, total) => `${learned}/${total} learned`,
        overview: "Overview",
        cramSession: "Study session",
        box: "Box",
        lapse: "Lapse",
        streak: (n) => `Streak: ${n} correct answers`,
        hint: "Hint",
        context: "Context",
        tags: "Tags",
        deckType: "Deck type",
        continueLearning: "Continue learning",
        hideFromContinue: "Hide from »Continue learning«",
        showInContinue: "Show in »Continue learning« again",
        excludedFromContinue: "Hidden from »Continue learning«",
        pin: "Pin",
        unpin: "Unpin",
        deckHasErrors:
            "This deck has errors – sharing and printing are possible again once they are fixed.",
        draftAllCards: "All cards",
        draftNoCards: "This deck does not contain any cards yet.",
        saveDraft: "Save draft",
        saveDraftBody: "Choose a folder to save the deck to.",
        newFolder: "New folder",
        newFolderName: "Name of the new folder",
        pairing: "Pair devices",
        host: "Host",
        join: "Join",
        serverLink: "Server link",
        moonButton: "Put to sleep",
        mooned: "This card is asleep now.",
        wake: "Wake up",
        moonBox: "Moon box",
        pairingConsentTitle: "Really connect to this device?",
        pairingConsentBody:
            "Only connect if you created the link yourself. A foreign link can pair devices that then send each other all decks.",
        pairingConsentConfirm: "Yes, connect",
        pairingConsentCancel: "Cancel",
        importTitle: "Import deck",
        progressNoDeck: "No deck with matching content found for this progress.",
        shareDeck: "Share deck",
        syncProgress: "Synchronize",
        both: "Both",
        loadingDecks: "Loading decks …",
        loadingDeck: "Loading deck …",
        busySaving: "Saving …",
        busyDecrypting: "Decrypting …",
        busyCreating: "Creating …",
        busyEncrypting: "Encrypting …",
        boxLabel: (box) => (box >= BOX_COUNT ? "Learned" : (BOX_ROMANS[box - 1] ?? String(box))),
        countCards: (n) =>
            n === 0
                ? "No cards"
                : `${n} ${new Intl.PluralRules("en").select(n) === "one" ? "card" : "cards"}`,
        studyTime: (ms) => {
            const totalSeconds = Math.round(ms / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            if (hours > 0) return `${hours} h ${minutes} min`;
            if (minutes > 0) return `${minutes} min ${seconds} s`;
            return `${seconds} s`;
        },
        deckTypeLabel: (type) =>
            type === "greek" ? "Ancient Greek" : type === "latin" ? "Latin" : "English",
        deckTypeLanguage: (type) =>
            type === "greek" ? "Ancient Greek" : type === "latin" ? "Latin" : "English",
        helpSearchQuery: (answer, language, prompt) =>
            `"${answer}" in context in English with examples? ` +
            `And what about the translation from ${language} "${prompt}" (with examples too)?`,
        mnemonicSearchQuery: (prompt) =>
            `"${prompt}" mnemonics or related words in other languages`,
        draftName: (n) => `Draft-${n}`,
        pureMode: "Pure mode",
        pureModeDefault: "Pure mode – default for new decks",
        languageSection: "Language",
        languageDe: "Deutsch",
        languageEn: "English",
        printCard: "Card",
        printNumber: "No.",
        printFront: "Front",
        printBack: "Back",
        printContext: "Context",
        printImage: "Image",
        printLearnField: "Learning space",
        boxCountsAria: "Cards per box",
        heroTitle: "Learning that sticks.",
        heroText:
            "NSC is your flashcard box for vocabulary – local to this device, no account, spaced repetition à la Leitner.",
        heroCardBack: "to learn",
        heroFlipHint: "Flip the card",
        foldersHeading: "Folders",
        foldersSubtitle: "Choose a deck to study.",
        createDeck: "Create deck",
        docsCardTitle: "Documentation",
        docsCardText:
            "How NSC works – explained simply, including the technical background for developers.",
        emptyHome: "No decks found.",
        emptyHomeAction: "Upload your own deck",
        emptyDeck: "This deck has no cards.",
        emptyNoCards: "No cards available.",
        editorSourceLabel: "Markdown",
        editorPreviewLabel: "Preview",
        errorsCount: (n) =>
            `${n} ${new Intl.PluralRules("en").select(n) === "one" ? "error" : "errors"}`,
        pureModeState: (on) => (on ? "on" : "off"),
        saveAction: "Save",
        folderChooseTitle: "Choose folder",
        folderChooseHint: (deckName) => `The deck “${deckName}” will be saved in this folder.`,
        folderInputLabel: "Folder",
        backToEditor: "Back to editor",
        saveBlocked: "The deck still has errors – please fix them first.",
        saveFailed: "The deck could not be saved.",
        sectionLearning: "Learning",
        sectionSyncSettings: "Sync & settings",
        editorSourceAria: "Edit deck markdown",
        editorPreviewAria: "Preview",
        formatAction: "Format",
        formatTitle: "Format markdown (blank lines around the title, trailing spaces)",
        updateAvailable: "New version available",
        updateAction: "Update",
    },

    SYNC: {
        peerUnreachable: "The other device is unreachable – is it running host mode?",
        signalingFailed: "Connection to the signaling server failed – please check the network.",
        idTaken: "This peer ID is already taken – please try again.",
        connectionFailed: "Connection failed.",
        applied: (added, merged) => `applied: ${added} new decks, ${merged} merged`,
        doneOne: "Sync done – 1 new deck.",
        doneMany: (count) => `Sync done – ${count} new decks.`,
        packageInvalid: "Sync package invalid.",
        invalidPeerId: "Invalid peer ID.",
    },

    SHARE: {
        badRequest: "Invalid request.",
        linkExpired: "Link expired.",
        tooManyRequests: "Too many requests – please try again later.",
        notConfigured: "Server links are not configured on this server.",
        serverError: (status) => `Server error (HTTP ${status}).`,
        networkError: "Network error – are you online?",
        invalidResponse: "Invalid server response.",
        decryptFailed: "Key wrong or data damaged.",
        linkDamaged: "The link is invalid or damaged.",
    },
};
