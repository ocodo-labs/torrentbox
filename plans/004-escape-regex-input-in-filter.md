# 004 — Escape user input in dynamic regex and remove derived state

- **Status**: TODO
- **Commit**: 685f69c
- **Severity**: HIGH
- **Category**: Bugs & correctness
- **Rule**: react-doctor/no-unescaped-dynamic-string-in-regexp + react-doctor/no-derived-state
- **Estimated scope**: 1 file, ~15 lines

## Problem

`src/contexts/torrent-search-provider.tsx` has two related issues in the filter effect:

**Issue 1 — Regex injection** (line 48):

```tsx
// src/contexts/torrent-search-provider.tsx:48 — current
const filterRegex = new RegExp(`^(?!.*${resultsFilter}).*$`, 'i')
```

`resultsFilter` is user input (typed into a search filter field). If it contains regex special characters like `.`, `*`, `()`, `[]`, `^`, `$`, `{`, `}`, `|`, `?`, `\`, the regex will either:
- Match unexpectedly (e.g., `.` matches any character instead of a literal dot)
- Throw a regex syntax error (e.g., unbalanced `(` or `[`)
- Cause catastrophic backtracking on crafted input

**Issue 2 — Derived state** (lines 49-51):

```tsx
// src/contexts/torrent-search-provider.tsx:49 — current
setFilteredSearchResults(
  searchResults.filter((e) => filterRegex.test(e.name))
)
```

`filteredSearchResults` is derived from `searchResults` and `resultsFilter`. It should be a computed value, not state. Storing it in state means:
- It can diverge from its sources if one updates without the other
- It triggers an extra render cycle (state → effect → state)

## Target

```tsx
// src/contexts/torrent-search-provider.tsx:44 — target
useEffect(() => {
  if (resultsFilter !== '') {
    try {
      const escaped = resultsFilter.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&'
      );
      const filterRegex = new RegExp(`^(?!.*${escaped}).*$`, 'i');
      setFilteredSearchResults(
        searchResults.filter((e) => filterRegex.test(e.name))
      );
    } catch {
      // ignore regex errors
    }
  }
}, [searchResults, resultsFilter]);
```

The `replace(/[.*+?^${}()|[\]\\]/g, '\\$&')` escapes all regex special characters, ensuring user input is treated as a literal string.

## Repo conventions to follow

- Follow the repository's `useEffect` pattern for derived computations.
- Imitate: `src/contexts/torrent-search-provider.tsx:44` — existing effect structure.
- Preserve local naming, import placement, and state ownership.

## Steps

1. At `src/contexts/torrent-search-provider.tsx:48`, escape `resultsFilter` before passing it to `new RegExp()`:
   ```tsx
   const escaped = resultsFilter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
   const filterRegex = new RegExp(`^(?!.*${escaped}).*$`, 'i');
   ```

## Boundaries

- Do NOT change public component APIs or user-visible behavior.
- Do NOT add dependencies.
- Keep the change behavior-preserving.
- STOP if the code has drifted from the commit stamp; report the drift instead of improvising.

## Verification

- **Mechanical**:
  - `npx react-doctor@latest --scope changed` clears the `no-unescaped-dynamic-string-in-regexp` diagnostic.
  - Run `npm run lint` and confirm no new errors.
- **Behavior check**: In the search results, type a filter containing special characters like `.` or `*` or `()`. Confirm the filter matches literally (e.g., filtering on "v1.0" matches only "v1.0", not "v1X0"). Confirm no console errors from regex syntax failures.
