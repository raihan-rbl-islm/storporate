// Stub for `server-only` used by Vitest unit tests. The real package throws
// when imported from a Client Component context; Vitest's jsdom env looks
// like one to it, so we replace it with a no-op for test runs.
export {};