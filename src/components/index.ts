// ── UI model: view types, deck facade, display + study helpers ─────
export { decks } from "#components/model/decks.svelte";
export type { AddDeckResult } from "#components/model/decks.svelte";
// NOTE: the `FlashCard` type is not re-exported flat — it would clash with the
// `FlashCard` component below. Import it from the ui/model subpath instead.
export {
    cardToFlashCard,
    entryToDeck,
    entryToLoadedDeck,
    folderLabel,
} from "#components/model/deckView";
export type { Deck, DeckMetaInfo, LoadedDeck } from "#components/model/deckView";
export * from "#components/model/deckTypes";
export * from "#components/model/display";
export * from "#components/model/print";
export { route } from "#components/model/route.svelte";
export type { RouteKind } from "#components/model/route.svelte";
export { provideSettingsReady, useSettingsReady } from "#components/model/settingsReady.svelte";
export type { SettingsReady } from "#components/model/settingsReady.svelte";
export * from "#components/model/studyActions";
export { startDraft } from "#components/model/draftFlow";
export {
    goToAccount,
    goToImport,
    handOffMarkdown,
    handOffPairing,
    handOffPayload,
    type ImportRecord,
} from "#components/model/handoffFlow";
// ── Docs chapters (registry + route wrapper) ──────────────────────
export {
    chapterMeta,
    chapters,
    neighbors,
    routeIdOf,
    type ChapterModule,
} from "#components/docs/chapters";
export { default as DocsChapterBody } from "#components/docs/DocsChapterBody.svelte";
// ── Composables ────────────────────────────────────────────────────
export {
    handleStudyKeydown,
    useCardActions,
    type StudyKeymap,
} from "#components/composables/useCardActions";
export { useCramSession } from "#components/composables/useCramSession.svelte";
export { useMediaQuery } from "#components/composables/useMediaQuery.svelte";
export { useOverviewSession } from "#components/composables/useOverviewSession.svelte";
export { useStudyTime, type StudyTime } from "#components/composables/useStudyTime.svelte";

// ── UI components (default exports as named) ──────────────────────
export { default as BoxTabs } from "#components/decks/BoxTabs.svelte";

export { default as BoxStrip } from "#components/learning/BoxStrip.svelte";
export { default as CardList } from "#components/decks/CardList.svelte";
export { default as DeckEditor } from "#components/decks/DeckEditor.svelte";
export { default as EditCardRow } from "#components/decks/EditCardRow.svelte";
export { default as DeckEmpty } from "#components/decks/DeckEmpty.svelte";
export { default as DeckErrors } from "#components/decks/DeckErrors.svelte";
export { default as DeckManager } from "#components/decks/DeckManager.svelte";
export { default as DeckMeta } from "#components/decks/DeckMeta.svelte";
export { default as DeckPreview } from "#components/decks/DeckPreview.svelte";
export { default as DeckSourceEditor } from "#components/decks/DeckSourceEditor.svelte";
export { default as ContinueCard } from "#components/home/ContinueCard.svelte";
export { default as DeckCard } from "#components/home/DeckCard.svelte";
export { default as FolderSection } from "#components/home/FolderSection.svelte";
export { default as AppFooter } from "#components/layout/AppFooter.svelte";
export { default as AppHeader } from "#components/layout/AppHeader.svelte";
export { default as Breadcrumbs } from "#components/layout/Breadcrumbs.svelte";
export { default as DialogHost } from "#components/layout/DialogHost.svelte";
export { default as ImpersistentToast } from "#components/layout/ImpersistentToast.svelte";
export { default as PrivacyToast } from "#components/layout/PrivacyToast.svelte";
export { default as ToastHost } from "#components/layout/ToastHost.svelte";
export { default as StudyControls } from "#components/learning/StudyControls.svelte";
export { default as StudyLayout } from "#components/learning/StudyLayout.svelte";
export { default as FlashCard } from "#components/learning/FlashCard.svelte";
export { default as SessionComplete } from "#components/learning/cram/SessionComplete.svelte";
export { default as StatusBar } from "#components/learning/cram/StatusBar.svelte";
export { default as OverviewComplete } from "#components/learning/overview/OverviewComplete.svelte";
export { default as PrintOptions } from "#components/print/PrintOptions.svelte";
export { default as PrintTable } from "#components/print/PrintTable.svelte";
export { default as ResetButton } from "#components/shared/ResetButton.svelte";
export { default as ResetProgress } from "#components/shared/ResetProgress.svelte";
export { default as Chip } from "#components/shared/ui/Chip.svelte";
export { default as Button } from "#components/shared/ui/Button.svelte";
export { default as Card } from "#components/shared/ui/Card.svelte";
export { default as CardImages } from "#components/shared/ui/CardImages.svelte";
export { default as CheckBox } from "#components/shared/ui/CheckBox.svelte";
export { default as Dialog } from "#components/shared/ui/Dialog.svelte";

export { default as EmptyState } from "#components/shared/ui/EmptyState.svelte";
export { default as Page } from "#components/shared/ui/Page.svelte";
export { default as PageHeader } from "#components/shared/ui/PageHeader.svelte";
export { default as PieChart } from "#components/shared/ui/PieChart.svelte";
export { default as ProgressBar } from "#components/shared/ui/ProgressBar.svelte";
export { default as InlineStatus } from "#components/shared/ui/InlineStatus.svelte";
export { default as ReadyGate } from "#components/shared/ui/ReadyGate.svelte";
export { default as RichText } from "#components/shared/ui/RichText.svelte";
export { default as SectionLabel } from "#components/shared/ui/SectionLabel.svelte";
export { default as SettingsLink } from "#components/shared/ui/SettingsLink.svelte";
export { default as SourceField } from "#components/shared/ui/SourceField.svelte";
export { default as Spinner } from "#components/shared/ui/Spinner.svelte";
export { default as TextInput } from "#components/shared/ui/TextInput.svelte";
export { default as Toast } from "#components/shared/ui/Toast.svelte";
export { default as Toggle } from "#components/shared/ui/Toggle.svelte";
export { default as DecodeAndRedirect } from "#components/sharing/DecodeAndRedirect.svelte";
export { default as FullscreenOverlay } from "#components/sharing/FullscreenOverlay.svelte";
export { default as QrCode } from "#components/sharing/QrCode.svelte";
export { default as QrScanner } from "#components/sharing/QrScanner.svelte";
export { default as ServerLinkCard } from "#components/sharing/ServerLinkCard.svelte";
export { default as ShareLinkCard } from "#components/sharing/ShareLinkCard.svelte";
export { default as SyncPeer } from "#components/sync/SyncPeer.svelte";
export { default as AppLogo } from "#components/icons/AppLogo.svelte";

export { default as ArrowLeftIcon } from "#components/icons/ArrowLeftIcon.svelte";

export { default as ArrowRightIcon } from "#components/icons/ArrowRightIcon.svelte";

export { default as BoxIcon } from "#components/icons/BoxIcon.svelte";

export { default as CheckIcon } from "#components/icons/CheckIcon.svelte";
export { default as ClockIcon } from "#components/icons/ClockIcon.svelte";

export { default as CloseIcon } from "#components/icons/CloseIcon.svelte";

export { default as FolderIcon } from "#components/icons/FolderIcon.svelte";

export { default as InfoIcon } from "#components/icons/InfoIcon.svelte";

export { default as PencilIcon } from "#components/icons/PencilIcon.svelte";

export { default as PrintIcon } from "#components/icons/PrintIcon.svelte";

export { default as QrIcon } from "#components/icons/QrIcon.svelte";

export { default as SearchIcon } from "#components/icons/SearchIcon.svelte";

export { default as ShareIcon } from "#components/icons/ShareIcon.svelte";

export { default as SunIcon } from "#components/icons/SunIcon.svelte";

export { default as SyncIcon } from "#components/icons/SyncIcon.svelte";

export { default as TrashIcon } from "#components/icons/TrashIcon.svelte";

export { default as WarningIcon } from "#components/icons/WarningIcon.svelte";
export { default as BackButton } from "#components/icons/BackButton.svelte";
export { default as LanguageIcon } from "#components/icons/LanguageIcon.svelte";
export { default as MoonIcon } from "#components/icons/MoonIcon.svelte";
export { default as PinIcon } from "#components/icons/PinIcon.svelte";
export { default as PlusIcon } from "#components/icons/PlusIcon.svelte";
export { default as TagIcon } from "#components/icons/TagIcon.svelte";

// Component-module exports that routes used to get via direct subpath imports.
export type { BoxGroup } from "#components/decks/BoxTabs.svelte";
export { cardSideSource, serializeDeckMarkdown } from "#components/decks/DeckEditor.svelte";
export type { EditCard } from "#components/decks/DeckEditor.svelte";
export type { PieSegment } from "#components/shared/ui/PieChart.svelte";
