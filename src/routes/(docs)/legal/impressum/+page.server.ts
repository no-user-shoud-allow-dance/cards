import {
    IMPRESSUM_CITY,
    IMPRESSUM_COUNTRY,
    IMPRESSUM_EMAIL,
    IMPRESSUM_NAME,
    IMPRESSUM_STREET,
    IMPRESSUM_ZIP,
} from "$app/env/private";
import type { PageServerLoad } from "./$types";

/**
 * The imprint (Impressum) data is deliberately NOT in the source code:
 * it comes from the environment (`.env` locally, Vercel env settings in
 * production — see `.env.example`) and is only read server-side here.
 */
export const load: PageServerLoad = () => ({
    impressum: {
        name: IMPRESSUM_NAME ?? "",
        street: IMPRESSUM_STREET ?? "",
        zip: IMPRESSUM_ZIP ?? "",
        city: IMPRESSUM_CITY ?? "",
        country: IMPRESSUM_COUNTRY ?? "",
        email: IMPRESSUM_EMAIL ?? "",
    },
});
