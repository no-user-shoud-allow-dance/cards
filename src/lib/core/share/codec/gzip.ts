import { ErrorCode, NscError } from "#lib/core/errors";

/**
 * Pipes `bytes` through a compression/decompression stream and collects
 * everything that comes back out into one contiguous {@link Uint8Array}.
 *
 * Runs both stream ends concurrently: the input is written (and the writable
 * side closed) fire-and-forget while the readable side is drained until EOF.
 *
 * @param bytes - Raw bytes to feed into the stream's writable side
 * @param stream - The stream to pipe through, e.g. `new CompressionStream("gzip")`
 * @returns All bytes emitted on the stream's readable side, concatenated in order
 *
 * @remarks
 * Closing the writable side is semantically essential for gzip: it signals
 * "no more input", which makes the compressor flush its final deflate block
 * and append the CRC32 + length trailer. Engine failures (e.g. corrupt gzip
 * data) surface as rejections from `reader.read()`.
 */
async function throughStream(
    bytes: Uint8Array,
    stream: CompressionStream | DecompressionStream,
    maxBytes?: number
): Promise<Uint8Array> {
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Feed the input, then close the writable side — WITHOUT awaiting.
    //
    // close() is semantically essential for gzip: it signals "no more
    // input", which is what makes the compressor flush. A gzip reader that
    // never sees the writer close would hang waiting for more input,
    // so `reader.read()` below would never return `done`.
    //
    // The `void` marks this as intentionally not awaited: writing and
    // reading proceed concurrently. (For a single input chunk this is
    // an optimization, not a necessity
    // but it also means `throughStream` resolves on the reader's EOF,
    // not on the writer's completion.)
    void writer.write(bytes as BufferSource).then(() => writer.close());

    // Drain the readable end until EOF. `read()` resolves with
    //   { done: false, value: chunk }  — the engine's output arrives
    //                                   in arbitrarily-sized pieces
    //   { done: true,  value: undefined } — writer closed AND all
    //                                   output has been consumed.
    // A failure inside the engine (e.g. gunzip hitting corrupt data)
    // surfaces here as a rejection from read(), which is what the
    // caller's try/catch around gunzipBytes relies on.
    const chunks: Uint8Array[] = [];
    let total = 0;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        total += value.length;
        // Decompression-bomb guard: stop draining as soon as the output
        // exceeds the cap instead of allocating the full expansion.
        if (maxBytes !== undefined && total > maxBytes) {
            await reader.cancel().catch(() => {});
            throw new NscError(ErrorCode.LINK_PAYLOAD_TOO_LARGE, {
                length: total,
                cap: maxBytes,
            });
        }
    }

    // Flatten the chunks into one buffer. We can't assume `chunks.length === 1`.
    // Two passes: first sum the sizes, then copy each chunk in at a
    // running offset.
    const out = new Uint8Array(total);

    let offset = 0;
    for (const c of chunks) {
        out.set(c, offset);
        offset += c.length;
    }

    return out;
}

/**
 * Compresses bytes with gzip
 *
 * @param bytes - Raw bytes to compress
 * @returns Gzip-compressed bytes
 */
export async function gzipBytes(bytes: Uint8Array): Promise<Uint8Array> {
    return throughStream(bytes, new CompressionStream("gzip"));
}

/**
 * Decompresses a complete gzip stream
 *
 * @param bytes - Gzip-compressed bytes produced by {@link gzipBytes} or any standard gzip implementation
 * @param maxBytes - Optional cap on the decompressed size; throws LINK_PAYLOAD_TOO_LARGE past it
 * @returns Raw decompressed bytes
 */
export async function gunzipBytes(bytes: Uint8Array, maxBytes?: number): Promise<Uint8Array> {
    return throughStream(bytes, new DecompressionStream("gzip"), maxBytes);
}
