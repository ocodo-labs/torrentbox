# 003 — Fix missing effect dependencies and effect chain in RenameTVShowView

- **Status**: TODO
- **Commit**: 685f69c (base); current HEAD: 4172b57
- **Severity**: HIGH
- **Category**: Bugs & correctness
- **Rule**: react-doctor/exhaustive-deps + react-doctor/no-effect-chain + react-doctor/no-derived-state
- **Estimated scope**: 1 file, ~20 lines

## Problem

`src/components/rename-tvshow-view.tsx` has three effects that form a chain and miss dependencies:

**Effect 1** (lines 62-71) — computes `entries` from torrent files:

```tsx
// src/components/rename-tvshow-view.tsx:62 — current
useEffect(() => {
  const videoFilenames: FileEntries = getShowVideoFilenames(torrent).map(
    filename => {
      const basename = filename.replace(`${torrent.name}/`, '');
      const ext = basename.split('.').pop();
      const basenameNoExt = basename.replace(`.${ext}`, '');

      let replaced = isRepeated
        ? basenameNoExt.replaceAll(pattern, replacement)
        : basenameNoExt.replace(pattern, replacement);

      if (isRegex) {
        try {
          replaced = basenameNoExt.replace(new RegExp(pattern), replacement);
        } catch {
          // ignore regex errors
        }
      }
      return { filename, basename, basenameNoExt, replaced, ext };
    }
  )

  setEntries(videoFilenames)
}, []);  // ← missing: pattern, replacement, isRepeated, torrent
```

This effect only runs once on mount. When the user changes `pattern`, `replacement`, `isRegex`, or `torrent`, the entries never update — the UI shows stale data.

**Effect 2** (lines 73-75) — derives `replacements` and `changed` from `entries`:

```tsx
// src/components/rename-tvshow-view.tsx:73 — current
useEffect(() => {
  setReplacements(entries.map(e => e.replaced))
  setChanged(entries.filter(e => e.replaced != e.basenameNoExt))
}, [entries])
```

This is a derived-state anti-pattern: `replacements` and `changed` are both derived from `entries`. They should be computed values, not state.

**Effect 3** (lines 77-79) — derives `hasDupes` from `replacements`:

```tsx
// src/components/rename-tvshow-view.tsx:77 — current
useEffect(() => {
  setHasDupes(Array.from(new Set(replacements)).length != replacements.length)
}, [replacements])
```

Another derived state: `hasDupes` is derived from `replacements`, which is derived from `entries`. Three effects in a chain.

**Also** — `batchRenamePayload` (line 83) is computed on every render from state instead of using `useMemo`.

## Target

Replace all three effects with a single effect for `entries` (with correct deps) and `useMemo` for the derived values:

```tsx
// src/components/rename-tvshow-view.tsx:62 — target (entries effect with deps)
useEffect(() => {
  const videoFilenames: FileEntries = getShowVideoFilenames(torrent).map(
    filename => {
      const basename = filename.replace(`${torrent.name}/`, '');
      const ext = basename.split('.').pop();
      const basenameNoExt = basename.replace(`.${ext}`, '');

      let replaced = isRepeated
        ? basenameNoExt.replaceAll(pattern, replacement)
        : basenameNoExt.replace(pattern, replacement);

      if (isRegex) {
        try {
          replaced = basenameNoExt.replace(new RegExp(pattern), replacement);
        } catch {
          // ignore regex errors
        }
      }
      return { filename, basename, basenameNoExt, replaced, ext };
    }
  )

  setEntries(videoFilenames)
}, [pattern, replacement, isRepeated, torrent]);
```

```tsx
// src/components/rename-tvshow-view.tsx:73 — target (replacements as useMemo)
const replacements = useMemo(
  () => entries.map(e => e.replaced),
  [entries]
);
```

```tsx
// src/components/rename-tvshow-view.tsx:77 — target (changed as useMemo)
const changed = useMemo(
  () => entries.filter(e => e.replaced !== e.basenameNoExt),
  [entries]
);
```

```tsx
// src/components/rename-tvshow-view.tsx:81 — target (hasDupes as useMemo)
const hasDupes = useMemo(
  () => {
    const unique = new Set(replacements);
    return unique.size !== replacements.length;
  },
  [replacements]
);
```

Also update `batchRenamePayload` to use `useMemo`:

```tsx
// src/components/rename-tvshow-view.tsx:83 — target
const batchRenamePayload = useMemo(
  () => entries.map(e => ({
    newname: `${e.replaced}.${e.ext}`,
    filename: e.filename
  })),
  [entries]
);
```

And remove the old `useState` declarations for `replacements`, `changed`, and `hasDupes` (lines 27, 29, 30), replacing them with the `useMemo` declarations above.

## Repo conventions to follow

- Follow the repository's `useMemo` pattern for derived values.
- Imitate: `src/contexts/transmission-provider.tsx:250` — `sortedTorrents` uses `useMemo` with explicit deps.
- Preserve local naming, import placement, and state ownership.

## Steps

1. At `src/components/rename-tvshow-view.tsx:9`, add `useMemo` to the React import: `import { useEffect, useMemo, useState, type FC } from "react";`.
2. At `src/components/rename-tvshow-view.tsx:62`, add `pattern, replacement, isRepeated, torrent` to the dependency array of the first `useEffect`.
3. At `src/components/rename-tvshow-view.tsx:27`, remove `const [replacements, setReplacements] = useState<string[]>([]);` and replace with `const replacements = useMemo(() => entries.map(e => e.replaced), [entries]);`.
4. At `src/components/rename-tvshow-view.tsx:29`, remove `const [changed, setChanged] = useState<FileEntries>([]);` and replace with `const changed = useMemo(() => entries.filter(e => e.replaced !== e.basenameNoExt), [entries]);`.
5. At `src/components/rename-tvshow-view.tsx:30`, remove `const [hasDupes, setHasDupes] = useState<boolean>(false);` and replace with `const hasDupes = useMemo(() => { const unique = new Set(replacements); return unique.size !== replacements.length; }, [replacements]);`.
6. Remove the three `useEffect` blocks at lines 73-79.
7. At `src/components/rename-tvshow-view.tsx:83`, wrap `batchRenamePayload` in `useMemo(() => entries.map(...), [entries])`.

## Boundaries

- Do NOT change public component APIs or user-visible behavior.
- Do NOT add dependencies.
- Keep the change behavior-preserving.
- STOP if the code has drifted from the commit stamp; report the drift instead of improvising.

## Verification

- **Mechanical**:
  - `npx react-doctor@latest --scope changed` clears the `exhaustive-deps`, `no-effect-chain`, and `no-derived-state` diagnostics.
  - Run `npm run lint` and confirm no new errors.
- **Behavior check**: Open the rename dialog for a TV show torrent. Type a pattern in the "Replace" field and a replacement in the "With" field. Confirm the file list updates in real-time showing the new names. Toggle regex on/off and confirm entries recompute. Toggle "Replace All" and confirm behavior changes.
