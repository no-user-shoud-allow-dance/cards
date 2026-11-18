/**
 * The pure domain layer: functions and types only — no DOM, no Svelte,
 * no stores, no fetch. Runs unchanged under Node/Bun tests.
 */
export * from "#lib/core/errors";
export * from "#lib/core/primitives";
export * from "#lib/core/deck/document";
export * from "#lib/core/deck/identity";
export * from "#lib/core/deck/inline";
export * from "#lib/core/deck/editor";
export * from "#lib/core/deck/hints";
export * from "#lib/core/deck/parse";
export * from "#lib/core/deck/serialize";
export * from "#lib/core/deck/format";
export * from "#lib/core/deck/ids";
export * from "#lib/core/deck/hash";
export * from "#lib/core/deck/normalize";
export * from "#lib/core/learning/leitner";
export * from "#lib/core/learning/state";
export * from "#lib/core/learning/session";
export * from "#lib/core/learning/stats";
export * from "#lib/core/share/codec/";
export * from "#lib/core/share/links";
export * from "#lib/core/share/crypto";
