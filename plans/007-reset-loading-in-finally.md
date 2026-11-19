# 007 — Reset loading flag in finally block in ServerConfigProvider

- **Status**: TODO
- **Commit**: 685f69c
- **Severity**: HIGH
- **Category**: Bugs & correctness
- **Rule**: react-doctor/no-loading-flag-reset-outside-finally
- **Estimated scope**: 1 file, ~5 lines

## Problem

`src/contexts/server-config-provider.tsx:38-48` sets `loading` to `true` at the start of `fetchConfig`, but only resets it to `false` inside the `if (response.ok)` branch:

```tsx
// src/contexts/server-config-provider.tsx:38 — current
const fetchConfig = async () => {
  setLoading(true)
  const response = await fetch('/api/config')
  if (response.ok) {
    setConfig(await response.json())
    setLoading(false)
    toast('Settings loaded')
  } else {
    setError('Failed to get server config')
    // ← loading stays true forever!
  }
}
```

If the server returns a non-2xx status (e.g., 500, 503, network error), `setLoading(false)` is never called. The UI stays stuck on a loading spinner indefinitely, and the user cannot retry or interact with the settings.

## Target

```tsx
// src/contexts/server-config-provider.tsx:38 — target
const fetchConfig = async () => {
  setLoading(true)
  setError(null)
  try {
    const response = await fetch('/api/config')
    if (response.ok) {
      setConfig(await response.json())
      toast('Settings loaded')
    } else {
      setError('Failed to get server config')
    }
  } catch {
    setError('Failed to get server config')
  } finally {
    setLoading(false)
  }
}
```

Also add `setError(null)` at the start to clear any previous error before a new fetch.

## Repo conventions to follow

- Follow the repository's `try/catch/finally` pattern for async operations.
- Imitate: `src/contexts/transmission-provider.tsx:755-770` — `batchRenameTorrentFiles` uses `try/catch/finally` with `fetchTorrents()` in finally.
- Preserve local naming, import placement, and state ownership.

## Steps

1. At `src/contexts/server-config-provider.tsx:38`, wrap the fetch logic in a `try/catch/finally` block.
2. Move `setLoading(false)` into a `finally` block.
3. Add `setError(null)` at the start of `fetchConfig` to clear stale errors.
4. Add a `catch` block that sets `setError('Failed to get server config')`.

## Boundaries

- Do NOT change public component APIs or user-visible behavior.
- Do NOT add dependencies.
- Keep the change behavior-preserving.
- STOP if the code has drifted from the commit stamp; report the drift instead of improvising.

## Verification

- **Mechanical**:
  - `npx react-doctor@latest --scope changed` clears the `no-loading-flag-reset-outside-finally` diagnostic.
  - Run `npm run lint` and confirm no new errors.
- **Behavior check**: Open the server config modal. If the server is down or returns an error, confirm the loading spinner disappears and the error message appears. Confirm the user can retry by clicking the settings button again.
