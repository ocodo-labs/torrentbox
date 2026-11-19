# Plans — React Improvements

Recommended execution order. Some plans are independent; others should be done in sequence.

| # | Plan | Severity | Category | Depends On | Status |
|---|------|----------|----------|------------|--------|
| 001 | Add missing key to entries list in RenameTVShowView | HIGH | Bugs & correctness | — | DONE |
| 002 | Extract side effects from state updater in PinnedQueriesCheckModal | HIGH | Bugs & correctness | — | DONE |
| 003 | Fix missing effect dependencies and effect chain in RenameTVShowView | HIGH | Bugs & correctness | — | DONE |
| 004 | Escape user input in dynamic regex and remove derived state | HIGH | Bugs & correctness | — | TODO |
| 005 | Check fetch response status before parsing body | HIGH | Bugs & correctness | — | TODO |
| 006 | Add noopener to window.open in LinkListItem | HIGH | Security | — | TODO |
| 007 | Reset loading flag in finally block in ServerConfigProvider | HIGH | Bugs & correctness | — | TODO |
| 008 | Fix removeNoise applied to wrong portion of filename | HIGH | Bugs & correctness | — | TODO |

## Execution Notes

- All 8 plans are independent — they touch different files and can be executed in any order.
- Plans 001 and 003 both touch `rename-tvshow-view.tsx`. Execute 001 first (adds a key), then 003 (rewrites effects). The combined diff is cleanest if done sequentially.
- Plan 002 touches `pinned-queries-check-modal.tsx` which also has `no-array-index-as-key` findings (lines 282, 363, 449) — those are not in scope for this plan but could be addressed in a follow-up.

## How to execute

Run a plan with: `improve-react execute <plan>`

Each plan includes mechanical verification (React Doctor score, lint) and behavioral verification (click through the affected UI).
