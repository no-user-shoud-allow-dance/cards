<script lang="ts">
    import type { HTMLAttributes } from "svelte/elements";
    import Button from "./ui/Button.svelte";
    import { dialogStore } from "#lib/stores/session/dialogStore.svelte";

    // class/aria-*/… are forwarded to the inner Button (which merges class
    // with its own) via {...rest}.
    let {
        label,
        confirmText,
        onReset,
        confirmLabel = "Bestätigen",
        variant = "danger",
        ...rest
    }: {
        label: string;
        confirmText: string;
        onReset: () => void;
        confirmLabel?: string;
        variant?: "danger" | "neutral";
    } & HTMLAttributes<HTMLElement> = $props();

    async function handleClick(): Promise<void> {
        const ok = await dialogStore.open({
            title: label,
            message: confirmText,
            confirmLabel,
            cancelLabel: "Abbrechen",
            bg: variant === "danger" ? "danger" : "surface",
        });
        if (ok) onReset();
    }
</script>

<Button
    variant={variant === "danger" ? "danger" : "secondary"}
    onclick={handleClick}
    {...rest}
>
    {label}
</Button>
