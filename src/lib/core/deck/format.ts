/**
 * Formatter for deck markdown, used by the editor's
 * "Formatieren" action. Pure string transform on the raw source (L0) —
 * it runs only in the editor surface and never builds a DeckDocument.
 *
 * Rules so far:
 * - trailing spaces/tabs are trimmed on every line;
 * - exactly one blank line before and after the H1 title (layout:
 *   frontmatter block, blank, `# Titel`, blank, cards).
 *
 * The formatter is conservative: when the source has no title (yet),
 * only the per-line space trim applies, so it is always safe to run on
 * an invalid intermediate state while typing.
 */

/**
 * Index of the title line (`# …`) per the parser's semantics: after
 * leading blanks and the optional frontmatter block, the first body
 * line starting with `# ` — but only before the first card line.
 * -1 when there is no title (no body, or a card/comment comes first).
 */
function findTitleIndex(lines: string[]): number {
    let i = 0;
    while (i < lines.length && lines[i]!.trim() === "") i++; // leading blanks
    if (i < lines.length && lines[i]!.trim() === "---") {
        i++;
        while (i < lines.length && lines[i]!.trim() !== "---") i++; // frontmatter body
        if (i >= lines.length) return -1; // unterminated frontmatter: no body
        i++; // past the closing "---"
    }
    for (; i < lines.length; i++) {
        const trimmed = lines[i]!.trim();
        if (trimmed === "" || trimmed.startsWith("//")) continue;
        return trimmed.startsWith("# ") ? i : -1;
    }
    return -1;
}

/**
 * The lines before/after the title, with the boundary blanks normalized
 * to exactly one (or none at the file edges). `blank` is the blank line
 * in the file's own line-ending style (`"\r"` for CRLF files, `""` else).
 */
function withBoundaryBlank(lines: string[], atStart: boolean, blank: string): string[] {
    const out = [...lines];
    if (atStart) {
        while (out.length > 0 && out[out.length - 1]!.trim() === "") out.pop();
        if (out.some((l) => l.trim() !== "")) out.push(blank);
    } else {
        while (out.length > 0 && out[0]!.trim() === "") out.shift();
        if (out.some((l) => l.trim() !== "")) out.unshift(blank);
    }
    return out;
}

/** Trims trailing spaces/tabs from one line (a trailing `"\r"` of a CRLF line stays). */
function trimLineEnd(line: string): string {
    return line.replace(/[ \t]+(?=\r?$)/, "");
}

/**
 * Returns the source with its H1 title line replaced by `# <title>`;
 * when the source has no title line, the header is inserted where the
 * parser looks for it (after leading blanks and the frontmatter block).
 * Card lines stay verbatim. Pure L0 transform — used to name draft
 * decks at creation time.
 */
export function setDeckTitleSource(source: string, title: string): string {
    const lines = source.split("\n");
    const titleIdx = findTitleIndex(lines);
    if (titleIdx !== -1) {
        lines[titleIdx] = `# ${title}`;
        return lines.join("\n");
    }
    // No title: insert one after leading blanks and the frontmatter block.
    let i = 0;
    while (i < lines.length && lines[i]!.trim() === "") i++;
    if (i < lines.length && lines[i]!.trim() === "---") {
        i++;
        while (i < lines.length && lines[i]!.trim() !== "---") i++;
        if (i < lines.length) i++; // past the closing "---"
    }
    lines.splice(i, 0, `# ${title}`);
    return lines.join("\n");
}

/**
 * Formats deck markdown: trailing spaces/tabs are trimmed on every
 * line, and there is exactly one blank line before and after the H1
 * title. Multiple blank lines at those boundaries collapse to one;
 * at the file edges (title is the first/last content) no blank line is
 * added. Line endings (LF/CRLF) and the trailing newline are preserved.
 */
export function formatDeckSource(source: string): string {
    const hadTrailingNl = source.endsWith("\n");
    const lines = source.split("\n").map(trimLineEnd);
    if (hadTrailingNl) lines.pop();

    const titleIdx = findTitleIndex(lines);
    if (titleIdx === -1) {
        // No title: only the per-line space trim applies.
        return lines.join("\n") + (hadTrailingNl ? "\n" : "");
    }

    // Inserted blank lines follow the file's line-ending style (CRLF).
    const blank = source.includes("\r\n") ? "\r" : "";
    const head = withBoundaryBlank(lines.slice(0, titleIdx), true, blank);
    const tail = withBoundaryBlank(lines.slice(titleIdx + 1), false, blank);
    return [...head, lines[titleIdx]!, ...tail].join("\n") + (hadTrailingNl ? "\n" : "");
}
