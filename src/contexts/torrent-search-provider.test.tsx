import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  TorrentSearchProvider,
  TorrentSearchContext,
  type TorrentSearchResult,
} from './torrent-search-provider'
import { type ReactNode, useContext } from 'react'

// Mock transmission context — TorrentSearchProvider requires it
vi.mock('@/contexts/transmission-provider', () => ({
  useTransmissionContext: vi.fn(() => ({
    fetchTorrents: vi.fn(),
    setHidden: vi.fn(),
    hidden: [],
    torrents: [],
    getShowVideoFilenames: vi.fn(() => []),
    batchRenameTorrentFiles: vi.fn(),
    isTVShowSeasonTorrent: () => false,
    canRename: () => false,
  })),
}))

// Minimal wrapper that exposes context values for testing
function useSearchTestHarness() {
  const ctx = useContext(TorrentSearchContext)
  if (!ctx) throw new Error('missing provider')
  return ctx
}

const wrapper = ({ children }: { children: ReactNode }) => (
  <TorrentSearchProvider>{children}</TorrentSearchProvider>
)

const makeResult = (name: string): TorrentSearchResult => ({
  id: name,
  name,
  magnet_link: 'magnet:?xt=urn:btih:test',
  seeds: '10',
  size: '1GB',
  category: 'movie',
})


describe('TorrentSearchProvider', () => {
  describe('filteredSearchResults', () => {
    it('is derived from searchResults and resultsFilter', () => {
      const results = [
        makeResult('Movie.2020.1080p'),
        makeResult('Movie 2020 1080p'),
        makeResult('Movie(2020)'),
        makeResult('Movie [2020]'),
        makeResult('Movie*2020'),
      ]

      const { result } = renderHook(() => useSearchTestHarness(), { wrapper })

      // Seed search results
      act(() => {
        result.current.setSearchResults(results)
      })

      // No filter — all results visible
      expect(result.current.filteredSearchResults).toHaveLength(5)

      // Filter with a dot — the filter is an exclusion filter (negative lookahead),
      // so items containing the literal "Movie.2020" are excluded.
      // "." only matches a literal dot, so only "Movie.2020.1080p" is excluded.
      act(() => {
        result.current.setResultsFilter('Movie.2020')
      })

      const filtered = result.current.filteredSearchResults
      expect(filtered).toHaveLength(4)
      expect(filtered.find((r) => r.name === 'Movie.2020.1080p')).toBeUndefined()
      expect(filtered.find((r) => r.name === 'Movie 2020 1080p')).toBeDefined()
      expect(filtered.find((r) => r.name === 'Movie(2020)')).toBeDefined()
    })

    it('does not throw on unbalanced regex characters', () => {
      const results = [
        makeResult('Show (2020)'),
        makeResult('Show [2020]'),
      ]

      const { result } = renderHook(() => useSearchTestHarness(), { wrapper })

      act(() => {
        result.current.setSearchResults(results)
      })

      // Unbalanced parens should not throw
      act(() => {
        result.current.setResultsFilter('(broken')
      })

      // Should still have results (no crash)
      expect(result.current.filteredSearchResults).toBeDefined()
    })

    it('is always consistent with searchResults — no stale divergence', () => {
      const results = [
        makeResult('A'),
        makeResult('B'),
        makeResult('C'),
      ]

      const { result, rerender } = renderHook(() => useSearchTestHarness(), {
        wrapper,
      })

      act(() => {
        result.current.setSearchResults(results)
      })
      act(() => {
        result.current.setResultsFilter('B')
      })

      // filteredSearchResults should always reflect the current state
      expect(result.current.filteredSearchResults).toHaveLength(2)
      expect(result.current.filteredSearchResults.map((r) => r.name)).toEqual(
        ['A', 'C']
      )

      // Add a new result and verify filtered updates immediately
      act(() => {
        result.current.setSearchResults([
          ...results,
          makeResult('D'),
          makeResult('B-extra'),
        ])
      })

      expect(result.current.filteredSearchResults).toHaveLength(3)
      expect(result.current.filteredSearchResults.map((r) => r.name)).toEqual([
        'A',
        'C',
        'D',
      ])
    })
  })
})
