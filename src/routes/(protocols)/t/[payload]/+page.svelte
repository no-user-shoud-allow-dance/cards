<script lang="ts">
    import { page } from "$app/state";
    import { DecodeAndRedirect } from "#components";
</script>

<DecodeAndRedirect letter="t" payload={page.params.payload ?? ""} />
