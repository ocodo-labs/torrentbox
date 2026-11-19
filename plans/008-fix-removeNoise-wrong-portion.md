# 008 — Fix removeNoise applied to wrong portion of filename

- **Status**: TODO
- **Severity**: HIGH
- **Category**: Bugs & correctness
- **Estimated scope**: 1 file, ~15 lines
- **User feedback**: User reports this as NOT AN ISSUE — do not prioritize without explicit request

## Problem

`src/lib/rename/om-rename-engine.ts` calls `removeNoise` on only the text *before* the year match, leaving noise tokens *after* the year untouched.

```
Input:  Movie.2020.1080p.mkv
Step 1: stripExtension → basename="Movie.2020.1080p", ext="mkv"
Step 2: findMovieYear finds "2020" at index 5
Step 3: removeNoise("Movie") → "Movie"  ✓
Step 4: "1080p" after the year is NEVER cleaned → stays in result
Result: "Movie 2020 1080p"  ✗  (expected: "Movie (2020)")
```

The same bug affects `suggestTv` (noise after the SxxExx marker) and `suggestMovie` (no-year path).

**Affected tests: 35 of 37 failing tests in `om-rename-engine.test.ts`:**
- All 6 noise removal tests
- All 8 movie tests
- All 7 TV show tests
- All 4 MIME type tests
- All 2 extension tests
- All 2 unknown file tests
- 3 input tests (empty, whitespace, trim)
- 1 prenoise test
- 3 path input tests

## Root Cause

In `findMovieYear` (line ~170), the code does:

```ts
const beforeYear = basename.slice(0, match.index);
const title = cleanTitle(removeNoise(beforeYear, config), config);
```

Only text *before* the year is cleaned. Noise after the year (`1080p`, `x265`, `GROUP`, etc.) is never stripped.

The same pattern exists in `suggestTv` — `removeNoise` is called on `before` and `after` separately, but `after` is the text *after* the SxxExx marker which may contain episode titles mixed with noise. The noise removal logic is correct for TV but the TV path is never reached because `suggestMovie` incorrectly matches first (noise isn't stripped, so `suggestMovie` thinks there's no noise and falls through to `suggestUnknown`).

Actually, the deeper issue: `suggestMovie`'s no-year path checks `noiseRemoved = cleaned !== normalized`. Since `cleanTitle(removeNoise(basename))` and `cleanTitle(basename)` produce the same result (noise was never applied to the full string), `noiseRemoved` is `false`, and the function returns `undefined`. Then `suggestUnknown` runs, which does `cleanTitle(basename)` — but `cleanTitle` only normalizes separators and capitalizes, it does NOT call `removeNoise`. So `suggestUnknown` also fails to strip noise.

## Target

**`findMovieYear`** — clean the full basename first, then find the year in the cleaned string:

```ts
const findMovieYear = (basename: string, config: RenameConfig) => {
  const cleaned = removeNoise(basename, config);  // ← clean full string first
  const yearRegex = new RegExp(config.patterns.movie.year, "g");
  const matches = [...cleaned.matchAll(yearRegex)];  // ← search cleaned string
  // ... rest uses `cleaned` instead of `basename`
}
```

**`suggestMovie` (no-year path)** — already calls `removeNoise(basename, config)` via `cleanTitle(removeNoise(basename, config))`. This should work once `removeNoise` is called on the full basename.

**`suggestTv`** — already calls `removeNoise(before)` and `removeNoise(after)`. This should work once the TV path is reached.

**`suggestUnknown`** — calls `cleanTitle(basename)` which does NOT call `removeNoise`. For unknown files, the comment says "we do NOT run semantic movie/TV noise stripping against them." But the tests expect noise to be stripped (e.g., `Movie.2020.1080p.mp4` → `Movie (2020).mp4`). The `suggestUnknown` path is only reached when neither TV nor movie match, so it shouldn't be stripping noise — the real fix is that TV/movie paths should match correctly.

## Steps

1. In `findMovieYear`, call `removeNoise(basename, config)` first and search for the year in the cleaned string.
2. In `suggestMovie` (no-year path), ensure `removeNoise` is called on the full basename before checking `noiseRemoved`.
3. Verify `suggestTv` already handles noise correctly (it calls `removeNoise` on both before and after the SxxExx marker).
4. Run `npx vitest run src/lib/rename/om-rename-engine.test.ts` to verify all 37 tests pass.

## Boundaries

- Do NOT change the noise token lists or patterns in `om_rename_config.json`.
- Do NOT change the `suggestUnknown` function's behavior (it should remain as-is for truly unknown files).
- Do NOT change the `MediaRenameEngine` class API or the `suggestRename` export.
- Keep the change behavior-preserving for correctly-formatted inputs.

## Verification

- **Mechanical**: `npx vitest run src/lib/rename/om-rename-engine.test.ts` — all 37 tests pass.
- **Behavior check**: Open the rename dialog for a TV show torrent. Type a pattern in the "Replace" field and a replacement in the "With" field. Confirm the file list updates in real-time showing the new names. Toggle regex on/off and confirm entries recompute. Toggle "Replace All" and confirm behavior changes.
