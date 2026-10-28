<script lang="ts">
    import Button from "./ui/Button.svelte";

    let {
        label,
        confirmText,
        onReset,
        variant = "danger",
        class: className = "",
    }: {
        label: string;
        confirmText: string;
        onReset: () => void;
        variant?: "danger" | "neutral";
        class?: string;
    } = $props();

    function handleClick(): void {
        if (!confirm(confirmText)) return;
        onReset();
    }
</script>

<Button
    variant={variant === "danger" ? "danger" : "secondary"}
    class={className}
    onclick={handleClick}
>
    {label}
</Button>
