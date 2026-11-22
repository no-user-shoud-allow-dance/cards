/// <reference types="@sveltejs/kit" />
declare global {
    namespace App {
        interface Error {
            status: number;
            message: string;
        }
        // interface Locals {}
        // interface PageData {}
        // interface PageState {}
        // interface Platform {}
    }
}

export {};
