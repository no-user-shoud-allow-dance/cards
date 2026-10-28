<script lang="ts">
    import { onMount } from "svelte";

    let { onDone }: { onDone: () => void } = $props();

    // Festive palette drawn from the app's theme colors.
    const COLORS = [
        "#3d5a80", // primary blue
        "#37714b", // success green
        "#a05a3c", // overview orange
        "#a04a41", // danger red
        "#c9a227", // gold
        "#7a5aa0", // violet
    ];

    const PIECE_COUNT = 160;
    const GRAVITY = 0.09;

    interface Piece {
        x: number;
        y: number;
        w: number;
        h: number;
        color: string;
        vx: number;
        vy: number;
        rotation: number;
        spin: number;
        phase: number;
    }

    let canvas: HTMLCanvasElement | null = null;

    onMount(() => {
        // Respect the reduced-motion preference: no animation, just done.
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            onDone();
            return;
        }

        if (!canvas) return;
        const context = canvas.getContext("2d");
        if (!context) return;
        // Alias with a non-nullable type so the animation closure below
        // does not have to re-narrow on every frame.
        const ctx: CanvasRenderingContext2D = context;

        const dpr = window.devicePixelRatio || 1;
        const width = window.innerWidth;
        const height = window.innerHeight;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.scale(dpr, dpr);

        const pieces: Piece[] = Array.from({ length: PIECE_COUNT }, () => ({
            x: Math.random() * width,
            // Stagger the start above the viewport so the rain feels
            // immediate instead of waiting for the first pieces to fall.
            y: -20 - Math.random() * height * 0.4,
            w: 6 + Math.random() * 6,
            h: 8 + Math.random() * 8,
            color:
                COLORS[Math.floor(Math.random() * COLORS.length)] ??
                COLORS[0],
            vx: -1.5 + Math.random() * 3,
            vy: 1 + Math.random() * 2.5,
            rotation: Math.random() * Math.PI * 2,
            spin: -0.12 + Math.random() * 0.24,
            phase: Math.random() * Math.PI * 2,
        }));

        let raf = 0;

        function frame(now: number): void {
            ctx.clearRect(0, 0, width, height);

            let alive = false;
            for (const piece of pieces) {
                piece.vy += GRAVITY;
                piece.x += piece.vx + Math.sin(now / 600 + piece.phase);
                piece.y += piece.vy;
                piece.rotation += piece.spin;

                if (piece.y < height + 20) alive = true;

                ctx.save();
                ctx.translate(piece.x, piece.y);
                ctx.rotate(piece.rotation);
                ctx.fillStyle = piece.color;
                ctx.fillRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h);
                ctx.restore();
            }

            // Gravity guarantees every piece eventually leaves the
            // screen; then the celebration is over.
            if (alive) {
                raf = requestAnimationFrame(frame);
            } else {
                onDone();
            }
        }

        raf = requestAnimationFrame(frame);

        return () => cancelAnimationFrame(raf);
    });
</script>

<canvas bind:this={canvas} class="confetti" aria-hidden="true"></canvas>

<style>
    .confetti {
        position: fixed;
        inset: 0;
        z-index: 60;
        pointer-events: none;
    }
</style>
