// Minimal ambient declaration so `tsc` can check the tests without the
// bun-types package (a dev dependency we don't add without permission).
declare module "bun:test" {
    interface Matchers {
        toBe(expected: unknown): void;
        toEqual(expected: unknown): void;
        toThrow(expected?: unknown): void;
        toBeNull(): void;
        toBeUndefined(): void;
        toBeTruthy(): void;
        toBeFalsy(): void;
        toContain(expected: unknown): void;
        toMatch(expected: unknown): void;
        toHaveLength(n: number): void;
        toBeCloseTo(n: number, digits?: number): void;
        toBeGreaterThan(n: number): void;
        toBeLessThan(n: number): void;
        not: Matchers;
    }
    export function describe(name: string, fn: () => void): void;
    export function test(name: string, fn: () => void | Promise<void>): void;
    export function it(name: string, fn: () => void | Promise<void>): void;
    export function expect<T>(value: T): Matchers;
    export function beforeEach(fn: () => void): void;
    export function afterEach(fn: () => void): void;
}
