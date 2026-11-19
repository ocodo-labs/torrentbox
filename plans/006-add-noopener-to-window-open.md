# 006 — Add noopener to window.open in LinkListItem

- **Status**: TODO
- **Commit**: 685f69c
- **Severity**: HIGH
- **Category**: Security
- **Rule**: react-doctor/window-open-without-noopener
- **Estimated scope**: 1 file, ~3 lines

## Problem

`src/components/listing-modals/link-list-item.tsx:11` opens a URL in a new tab without `noopener`:

```tsx
// src/components/listing-modals/link-list-item.tsx:11 — current
const handleClick = () => {
  window.open(link.href, '_blank');
};
```

When `window.open(url, '_blank')` is called without the third `features` argument including `noopener`, the opened page gets access to `window.opener`, which allows it to:
- Call `window.opener.location = ...` to phish the original page
- Access `window.opener.document` in same-origin scenarios
- Perform tabnabbing attacks

The fix is to pass `'noopener'` as the third argument.

## Target

```tsx
// src/components/listing-modals/link-list-item.tsx:11 — target
const handleClick = () => {
  window.open(link.href, '_blank', 'noopener');
};
```

## Repo conventions to follow

- Follow the repository's inline arrow function pattern.
- Imitate: `src/components/listing-modals/link-list-item.tsx:10` — existing `handleClick` structure.
- Preserve local naming, import placement, and state ownership.

## Steps

1. At `src/components/listing-modals/link-list-item.tsx:11`, add `'noopener'` as the third argument to `window.open()`.

## Boundaries

- Do NOT change public component APIs or user-visible behavior.
- Do NOT add dependencies.
- Keep the change behavior-preserving.
- STOP if the code has drifted from the commit stamp; report the drift instead of improvising.

## Verification

- **Mechanical**:
  - `npx react-doctor@latest --scope changed` clears the `window-open-without-noopener` diagnostic.
  - Run `npm run lint` and confirm no new errors.
- **Behavior check**: Click a link listing item. Confirm the link opens in a new tab as before. Verify the new tab's `window.opener` is `null` (check DevTools console in the new tab: `window.opener`).
