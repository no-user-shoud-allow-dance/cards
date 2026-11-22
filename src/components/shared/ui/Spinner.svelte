<script lang="ts">
    interface Props {
        /** Edge length of the square spinner image (px). */
        size?: number;
        /** Dark-variant spinner for use on dark surfaces. */
        monochrome?: boolean;
        /** Accessible label; empty renders the image as decorative (aria-hidden). */
        label?: string;
    }

    let { size = 24, monochrome = false, label = "" }: Props = $props();
</script>

<img
    src={`/app/spinner${monochrome ? "-monochrome" : ""}.svg`}
    alt={label}
    width={size}
    height={size}
    aria-hidden={label === "" ? true : undefined}
/>

<style lang="postcss">
    img {
        display: block;
    }
</style>
