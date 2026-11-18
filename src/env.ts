import { defineEnvVars } from "@sveltejs/kit/env";

export const variables = defineEnvVars({
    // Upstash

    UPSTASH_URL: {
        description: "Upstash REST endpoint, e.g. https://xxx.upstash.io",
        schema: (value) => value,
    },
    UPSTASH_TOKEN: {
        description: "Upstash REST bearer token (read-write)",
        schema: (value) => value,
    },
    UPSTASH_READ_ONLY_TOKEN: {
        description: "Upstash REST bearer token (read-only)",
        schema: (value) => value,
    },

    // Impressum

    IMPRESSUM_NAME: {
        description: "Full name of the responsible person",
        schema: (value) => value,
    },
    IMPRESSUM_STREET: {
        description: "Street and house number of the responsible person",
        schema: (value) => value,
    },
    IMPRESSUM_ZIP: {
        description: "Postal code of the responsible person",
        schema: (value) => value,
    },
    IMPRESSUM_CITY: {
        description: "City of the responsible person",
        schema: (value) => value,
    },
    IMPRESSUM_COUNTRY: {
        description: "Country of the responsible person",
        schema: (value) => value,
    },
    IMPRESSUM_EMAIL: {
        description: "Contact email of the responsible person",
        schema: (value) => value,
    },
});
