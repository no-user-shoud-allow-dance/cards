import { IMPRESSUM_EMAIL } from "$app/env/private";
import type { PageServerLoad } from "./$types";

/**
 * The contact email is deliberately NOT in the source code — it comes from
 * the environment (`.env` locally, Vercel env settings in production, see
 * `.env.example`) and is only read server-side here. Shared with the
 * imprint page (IMPRESSUM_EMAIL).
 */
export const load: PageServerLoad = () => ({
    contactEmail: IMPRESSUM_EMAIL ?? "",
});
