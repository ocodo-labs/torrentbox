import { describe, it, expect, beforeEach, vi } from 'vitest'
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
  beforeEach(() => {
    // Reset by re-rendering a fresh provider
  })

  describe('resultsFilter', () => {
    it('treats regex special characters as literals', async () => {
      const results = [
        makeResult('Movie.2020.1080p'),
        makeResult('Movie 2020 1080p'),
        makeResult('Movie(2020)'),
        makeResult('Movie [2020]'),
        makeResult('Movie*2020'),
      ]

      const { result } = renderHook(() => useSearchTestHarness(), { wrapper })

      // Seed search results
      await act(() => {
        result.current.setSearchResults(results)
      })

      // Filter with a dot — the filter is an exclusion filter (negative lookahead),
      // so items containing the literal "Movie.2020" are excluded.
      // With the fix, "." only matches a literal dot, so only
      // "Movie.2020.1080p" is excluded. The other 4 items remain.
      await act(() => {
        result.current.setResultsFilter('Movie.2020')
      })

      // Wait for the effect to run and state to settle
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0))
      })

      const filtered = result.current.filteredSearchResults
      expect(filtered).toHaveLength(4)
      // The item containing the literal "Movie.2020" should be excluded
      expect(filtered.find((r) => r.name === 'Movie.2020.1080p')).toBeUndefined()
      // Items where "." was previously matching any char should now survive
      expect(filtered.find((r) => r.name === 'Movie 2020 1080p')).toBeDefined()
      expect(filtered.find((r) => r.name === 'Movie(2020)')).toBeDefined()
    })

    it('does not throw on unbalanced regex characters', async () => {
      const results = [
        makeResult('Show (2020)'),
        makeResult('Show [2020]'),
      ]

      const { result } = renderHook(() => useSearchTestHarness(), { wrapper })

      await act(() => {
        result.current.setSearchResults(results)
      })

      // Unbalanced parens should not throw
      await act(() => {
        result.current.setResultsFilter('(broken')
      })

      await act(async () => {
        await new Promise((r) => setTimeout(r, 0))
      })

      // Should still have results (no crash)
      expect(result.current.filteredSearchResults).toBeDefined()
    })
  })
})
