<script lang="ts">
    import { page } from "$app/state";
    import { DecodeAndRedirect } from "#components";
</script>

<DecodeAndRedirect letter="c" payload={page.params.payload ?? ""} />
