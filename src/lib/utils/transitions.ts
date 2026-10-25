import { fade, type TransitionConfig } from "svelte/transition";

/**
 * Fade-out for keyed card swaps. The outgoing node is pinned absolutely at
 * the centered position it had in normal flow, so it never shares the flow
 * with the incoming card — previously both cards stacked for the duration
 * of the transitions and the page briefly grew a scrollbar.
 *
 * The parent container must be positioned (position: relative) and center
 * its in-flow card vertically.
 */
export function fadeOutInPlace(node: Element): TransitionConfig {
    const el = node as HTMLElement;
    el.style.position = "absolute";
    el.style.top = "50%";
    el.style.left = "0";
    el.style.right = "0";
    el.style.bottom = "auto";
    el.style.transform = "translateY(-50%)";
    el.style.margin = "0";
    return fade(el, { duration: 150 });
}
