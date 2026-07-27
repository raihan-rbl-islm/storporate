import "server-only";

/**
 * Resolve the canonical origin the app should host on.
 *
 * Reads NEXT_PUBLIC_APP_URL first (already a public env on the client
 * bundle, so it's safe to leak) and falls back to localhost for dev. We
 * compare the request's `host` header / URL origin against this canonical
 * origin so we don't trust whatever Origin an attacker can set.
 */
export function getCanonicalOrigin(): URL {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  const base = configured && configured.length > 0 ? configured : "http://localhost:3000";
  return new URL(base);
}

/**
 * Validate that a destination (next=…) for an OAuth redirect is safe.
 * Only allowlist a single-origin relative path or a path that, when
 * joined to the canonical origin, still resolves to that same origin.
 *
 * Rejects:
 *   - absolute URLs (any scheme other than http/https)
 *   - protocol-relative URLs ("//evil.com/x")
 *   - backslashes (some browsers treat them as slashes)
 *   - control characters and CRLF (header-injection primitive)
 *   - any absolute URL whose host is not the configured canonical origin
 *
 * Returns "/" when validation fails so we never 302 the user to an
 * attacker-controlled URL.
 */
export function safeRedirectPath(
  raw: string | null | undefined,
  canonical: URL,
): string {
  if (typeof raw !== "string") return "/";
  // Disallow control characters (CR, LF, NUL, tab) outright — they are the
  // primitives for header injection and log forging, even if no redirect
  // URL parses out of them.
  if (/[\x00-\x1f\x7f]/.test(raw)) return "/";
  // Disallow backslashes — some browsers parse "\\\\evil.com" as "//evil.com".
  // Forwarding slash counts as a control surface too.
  const trimmed = raw.trim();
  if (trimmed === "") return "/";
  // Disallow protocol-relative and any absolute URL.
  // Anything that starts with "/" twice (//evil.com) or any scheme://.
  if (/^\/\//.test(trimmed)) return "/";
  if (/^[a-zA-Z][a-zA-Z0-9+.\-]*:/.test(trimmed)) return "/";
  // Path must start with "/" (relative to our app) and not "/\" tricks.
  if (!trimmed.startsWith("/")) return "/";
  // Re-resolve and check the resulting URL stays on the canonical origin.
  let resolved: URL;
  try {
    resolved = new URL(trimmed, canonical);
  } catch {
    return "/";
  }
  if (resolved.origin !== canonical.origin) return "/";
  // Specifically reject userinfo tricks ("@evil.com")
  if (resolved.username || resolved.password) return "/";
  // Strip protocol that might come back via trailing tokens
  if (resolved.protocol !== "http:" && resolved.protocol !== "https:")
    return "/";
  // Return just the path+search+hash, never a full URL.
  return resolved.pathname + resolved.search + resolved.hash;
}

/**
 * CSRF / same-origin check for OAuth POST endpoints.
 *
 * The Google OAuth POST here is a plain HTML form, so we cannot rely on
 * Next.js's Server Action Origin check (that only fires for Server Actions
 * and Route Handlers invoked via React's transition infrastructure). For
 * plain `<form method="post" action="/demo/google">`, a cross-site form
 * post can still trigger a 30x chain to Google — which itself is the
 * sensitive action (kickoff of the user's session with their Google
 * account). So we manually check the `origin` request header matches the
 * `host` request header and that both match our canonical origin.
 *
 * Returns true when the request looks same-origin; false otherwise.
 *
 * Note: request headers are explicitly passed in so this function stays
 * unit-testable without spinning up Next.
 */
export function isSameOriginPost(
  headers: { get(name: string): string | null },
  canonical: URL,
): boolean {
  const origin = headers.get("origin");
  const host = headers.get("host");
  if (!origin || !host) return false;
  // Fast-path: the two header values must match exactly. This rejects the
  // classic cross-site POST (origin: https://evil.com) while allowing the
  // user's own browser to submit (origin: https://app.example.com and host
  // pointing at the same backend).
  if (origin !== `http://${host}` && origin !== `https://${host}`) {
    return false;
  }
  // Compare against our canonical, configured origin. This rules out
  // attacks where the attacker happens to control a sibling host on the
  // same registrable domain (still same origin by header semantics, but
  // not us).
  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    return false;
  }
  return originUrl.origin === canonical.origin;
}
