/**
 * Typed errors for the whole domain layer. Core throws `NscError` with a
 * closed `ErrorCode`; the German sentence for each code lives only in
 * `src/messages/languages/de.ts`. The UI catches once at the boundary and maps
 * code → text via `errorMessage()`. A code without a German message is a
 * compile error (exhaustive `never` switch there).
 */

export const ErrorCode = {
    // deck identity
    TITLE_EMPTY: "TITLE_EMPTY",
    TITLE_TOO_LONG: "TITLE_TOO_LONG",
    FOLDER_INVALID: "FOLDER_INVALID",
    FOLDER_TOO_LONG: "FOLDER_TOO_LONG",
    FOLDER_RESERVED_PREFIX: "FOLDER_RESERVED_PREFIX",
    META_VALUE_TOO_LONG: "META_VALUE_TOO_LONG",
    SLUG_INVALID: "SLUG_INVALID",
    // deck parsing
    PARSE_MISSING_TITLE: "PARSE_MISSING_TITLE",
    PARSE_MISSING_SEPARATOR: "PARSE_MISSING_SEPARATOR",
    PARSE_EMPTY_SIDE: "PARSE_EMPTY_SIDE",
    PARSE_INVALID_IMAGE_URL: "PARSE_INVALID_IMAGE_URL",
    PARSE_TOO_MANY_IMAGES: "PARSE_TOO_MANY_IMAGES",
    PARSE_UNTERMINATED_FRONTMATTER: "PARSE_UNTERMINATED_FRONTMATTER",
    PARSE_UNKNOWN_DECK_TYPE: "PARSE_UNKNOWN_DECK_TYPE",
    PARSE_TAG_TOO_LONG: "PARSE_TAG_TOO_LONG",
    SPAN_INVALID: "SPAN_INVALID",
    HINT_INVALID: "HINT_INVALID",
    // primitives
    EPOCH_INVALID: "EPOCH_INVALID",
    BOX_OUT_OF_RANGE: "BOX_OUT_OF_RANGE",
    EMPTY_ARRAY: "EMPTY_ARRAY",
    // share links / wire payloads
    LINK_UNKNOWN_KIND: "LINK_UNKNOWN_KIND",
    LINK_INVALID_ENCODING: "LINK_INVALID_ENCODING",
    LINK_PAYLOAD_TOO_LARGE: "LINK_PAYLOAD_TOO_LARGE",
    LINK_BAD_SHAPE: "LINK_BAD_SHAPE",
    SHARE_ID_INVALID: "SHARE_ID_INVALID",
    SHARE_KEY_INVALID: "SHARE_KEY_INVALID",
    SHARE_UNSUPPORTED_CIPHER: "SHARE_UNSUPPORTED_CIPHER",
    SHARE_DECRYPT_FAILED: "SHARE_DECRYPT_FAILED",
    // learning
    SESSION_EMPTY: "SESSION_EMPTY",
    SESSION_NOT_IN_PROGRESS: "SESSION_NOT_IN_PROGRESS",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/** Machine-readable details attached to an NscError (e.g. line numbers, limits). */
export type ErrorDetails = Record<string, string | number | boolean | undefined>;

export class NscError extends Error {
    readonly code: ErrorCode;
    readonly details: ErrorDetails;

    constructor(code: ErrorCode, details: ErrorDetails = {}) {
        super(code);
        this.name = "NscError";
        this.code = code;
        this.details = details;
    }
}

export function isNscError(error: unknown): error is NscError {
    return error instanceof NscError;
}
