<script lang="ts">
    import { onMount } from "svelte";
    import { messages } from "#lib";
    import { handOffPayload } from "#components/model/handoffFlow";
    import InlineStatus from "#components/shared/ui/InlineStatus.svelte";

    interface Props {
        letter: "c" | "p" | "t";
        payload: string;
    }

    let { letter, payload }: Props = $props();

    let errorText = $state("");

    onMount(() => {
        handOffPayload(letter, payload).catch((e: unknown) => {
            errorText = messages.messageOf(e);
        });
    });
</script>

<InlineStatus error={errorText} loading="Link wird geöffnet …" />
