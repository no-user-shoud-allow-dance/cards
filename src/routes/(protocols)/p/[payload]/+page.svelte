<script lang="ts">
    import { page } from "$app/state";
    import { DecodeAndRedirect } from "#components";
</script>

<DecodeAndRedirect letter="p" payload={page.params.payload ?? ""} />
