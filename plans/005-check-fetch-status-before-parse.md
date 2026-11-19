# 005 — Check fetch response status before parsing body

- **Status**: TODO
- **Commit**: 685f69c
- **Severity**: HIGH
- **Category**: Bugs & correctness
- **Rule**: react-doctor/no-fetch-response-used-without-status-check
- **Estimated scope**: 1 file, ~5 lines

## Problem

`src/lib/fetch-listing-functions.ts:12` calls `response.json()` without checking `response.ok`:

```tsx
// src/lib/fetch-listing-functions.ts:8 — current
export const fetchListingMagnet = async (
  href: string
): Promise<string | null> => {
  try {
    const response = await fetch("api/torrents/add-magnet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ href }),
    });
    const data = await response.json();  // ← no status check
    return data.magnet || null;
  } catch (err) {
    return null;
  }
};
```

If the server returns a non-2xx status (4xx client error, 5xx server error), calling `.json()` may:
- Throw if the error response body is not valid JSON
- Return garbage data that passes `data.magnet || null` (e.g., `data.magnet` is `undefined`, returns `null` — silently wrong)
- Mask the actual error from the user

Compare with the correct pattern already used elsewhere in the codebase:

```tsx
// src/contexts/torrent-search-provider.tsx:100 — correct pattern
if (!response.ok) {
  setSearching(false);
  if (data.detail) { toast(data.detail) }
  return;
}
```

## Target

```tsx
// src/lib/fetch-listing-functions.ts:8 — target
export const fetchListingMagnet = async (
  href: string
): Promise<string | null> => {
  try {
    const response = await fetch("api/torrents/add-magnet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ href }),
    });
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data.magnet || null;
  } catch (err) {
    return null;
  }
};
```

## Repo conventions to follow

- Follow the repository's `try/catch` + `response.ok` check pattern.
- Imitate: `src/contexts/torrent-search-provider.tsx:96-104` — fetch with status check.
- Preserve local naming, import placement, and error handling style.

## Steps

1. At `src/lib/fetch-listing-functions.ts:12`, add `if (!response.ok) { return null; }` before `const data = await response.json();`.

## Boundaries

- Do NOT change public component APIs or user-visible behavior.
- Do NOT add dependencies.
- Keep the change behavior-preserving (returns `null` on error, same as catch block).
- STOP if the code has drifted from the commit stamp; report the drift instead of improvising.

## Verification

- **Mechanical**:
  - `npx react-doctor@latest --scope changed` clears the `no-fetch-response-used-without-status-check` diagnostic.
  - Run `npm run lint` and confirm no new errors.
- **Behavior check**: Trigger a magnet fetch for a media item. Confirm the existing behavior (toast "Waiting for...", then "Added" or "No magnet link") is unchanged. If the server returns an error, confirm the user sees "No magnet link for ..." instead of a potential crash.
