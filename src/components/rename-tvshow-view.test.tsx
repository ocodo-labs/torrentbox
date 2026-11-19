import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { RenameTVShowView } from './rename-tvshow-view'
import type { Torrent } from '@/types/torrent'

// Mock the transmission context
const mockBatchRenameTorrentFiles = vi.fn()
const mockGetShowVideoFilenames = vi.fn()

vi.mock('@/contexts/transmission-provider', () => ({
  useTransmissionContext: vi.fn(() => ({
    getShowVideoFilenames: mockGetShowVideoFilenames,
    batchRenameTorrentFiles: mockBatchRenameTorrentFiles,
    isTVShowSeasonTorrent: () => true,
    canRename: () => true,
  })),
}))

const createTestTorrent = (name: string, episodeCount: number): Torrent => ({
  id: `test-${name}`,
  addedDate: Date.now(),
  name,
  percent: 50,
  speed: 1000000,
  total: 1000000000,
  ratio: 0.5,
  downloadRate: 1000000,
  uploadRate: 500000,
  secondsDownloading: 3600,
  magnet: 'magnet:?xt=urn:btih:test',
  stats: [],
  files: Array.from({ length: episodeCount }, (_, i) => [
    `${name}/Testing.Bad.${String(i + 1).padStart(2, '0')}.720p.WEB.x264-ABC[${i}].mkv`,
    500000000,
    250000000,
    0,
    false,
    0,
  ]),
})

describe('RenameTVShowView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockBatchRenameTorrentFiles.mockClear()
    mockGetShowVideoFilenames.mockClear()
  })

  describe('Auto Rename', () => {
    it('should compute correct payload from current entries when auto-rename is triggered', async () => {
      const torrent = createTestTorrent('Testing.Bad.S01', 3)
      const videoFilenames = [
        'Testing.Bad.S01/Testing.Bad.01.720p.WEB.x264-ABC[0].mkv',
        'Testing.Bad.S01/Testing.Bad.02.720p.WEB.x264-ABC[1].mkv',
        'Testing.Bad.S01/Testing.Bad.03.720p.WEB.x264-ABC[2].mkv',
      ]
      mockGetShowVideoFilenames.mockReturnValue(videoFilenames)

      await act(async () => {
        render(<RenameTVShowView torrent={torrent} />)
      })

      // Find and click the Auto Rename button
      const autoRenameButton = screen.getByText('Auto Rename')
      
      await act(async () => {
        fireEvent.click(autoRenameButton)
      })

      // Verify batchRenameTorrentFiles was called
      expect(mockBatchRenameTorrentFiles).toHaveBeenCalledWith(
        torrent,
        expect.arrayContaining([
          expect.objectContaining({
            filename: expect.stringContaining('Testing.Bad.01'),
            newname: expect.any(String),
          }),
          expect.objectContaining({
            filename: expect.stringContaining('Testing.Bad.02'),
            newname: expect.any(String),
          }),
          expect.objectContaining({
            filename: expect.stringContaining('Testing.Bad.03'),
            newname: expect.any(String),
          }),
        ])
      )
    })

    it('should use the latest entries when auto-rename is triggered after state updates', async () => {
      const torrent = createTestTorrent('Testing.Bad.S01', 2)
      const videoFilenames = [
        'Testing.Bad.S01/Testing.Bad.01.720p.WEB.x264-ABC[0].mkv',
        'Testing.Bad.S01/Testing.Bad.02.720p.WEB.x264-ABC[1].mkv',
      ]
      mockGetShowVideoFilenames.mockReturnValue(videoFilenames)

      await act(async () => {
        render(<RenameTVShowView torrent={torrent} />)
      })

      // Type a pattern in the first input
      const patternInput = screen.getAllByRole('textbox')[0]
      await act(async () => {
        fireEvent.change(patternInput, { target: { value: 'Testing' } })
      })

      // Type a replacement in the second input
      const replacementInput = screen.getAllByRole('textbox')[1]
      await act(async () => {
        fireEvent.change(replacementInput, { target: { value: 'The.Testing.Bad' } })
      })

      // Clear the pattern so Auto Rename becomes visible again
      await act(async () => {
        fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: '' } })
      })

      // Immediately trigger auto-rename (simulating fast user interaction)
      const autoRenameButton = screen.getByText('Auto Rename')
      
      await act(async () => {
        fireEvent.click(autoRenameButton)
      })

      // The payload should reflect the current state, not stale values
      expect(mockBatchRenameTorrentFiles).toHaveBeenCalled()
      const calledWith = mockBatchRenameTorrentFiles.mock.calls[0][1] as any[]
      
      // Verify the payload contains the updated entries
      expect(calledWith).toHaveLength(2)
      expect(calledWith[0].filename).toContain('Testing.Bad.01')
      expect(calledWith[1].filename).toContain('Testing.Bad.02')
    })
  })

  describe('Manual Regex Rename', () => {
    it('should compute correct payload from current entries when manual rename is triggered', async () => {
      const torrent = createTestTorrent('Testing.Bad.S01', 2)
      const videoFilenames = [
        'Testing.Bad.S01/Testing.Bad.01.720p.WEB.x264-ABC[0].mkv',
        'Testing.Bad.S01/Testing.Bad.02.720p.WEB.x264-ABC[1].mkv',
      ]
      mockGetShowVideoFilenames.mockReturnValue(videoFilenames)

      await act(async () => {
        render(<RenameTVShowView torrent={torrent} />)
      })

      // Type a pattern in the first input
      const patternInput = screen.getAllByRole('textbox')[0]
      await act(async () => {
        fireEvent.change(patternInput, { target: { value: 'Testing' } })
      })

      // Type a replacement in the second input
      const replacementInput = screen.getAllByRole('textbox')[1]
      await act(async () => {
        fireEvent.change(replacementInput, { target: { value: 'The.Testing.Bad' } })
      })

      // Find and click the Rename button (should appear when pattern is not empty)
      const renameButton = screen.getByText('Rename')
      
      await act(async () => {
        fireEvent.click(renameButton)
      })

      // Verify batchRenameTorrentFiles was called with correct payload
      expect(mockBatchRenameTorrentFiles).toHaveBeenCalledWith(
        torrent,
        expect.arrayContaining([
          expect.objectContaining({
            filename: expect.stringContaining('Testing.Bad.01'),
            newname: expect.any(String),
          }),
          expect.objectContaining({
            filename: expect.stringContaining('Testing.Bad.02'),
            newname: expect.any(String),
          }),
        ])
      )
    })

    it('should use the latest pattern/replacement values when rename is triggered', async () => {
      const torrent = createTestTorrent('Testing.Bad.S01', 2)
      const videoFilenames = [
        'Testing.Bad.S01/Testing.Bad.01.720p.WEB.x264-ABC[0].mkv',
        'Testing.Bad.S01/Testing.Bad.02.720p.WEB.x264-ABC[1].mkv',
      ]
      mockGetShowVideoFilenames.mockReturnValue(videoFilenames)

      await act(async () => {
        render(<RenameTVShowView torrent={torrent} />)
      })

      // Type a pattern
      const patternInput = screen.getAllByRole('textbox')[0]
      await act(async () => {
        fireEvent.change(patternInput, { target: { value: 'Bad' } })
      })

      // Type a replacement
      const replacementInput = screen.getAllByRole('textbox')[1]
      await act(async () => {
        fireEvent.change(replacementInput, { target: { value: 'Show' } })
      })

      // Immediately trigger rename (simulating fast user interaction)
      const renameButton = screen.getByText('Rename')
      
      await act(async () => {
        fireEvent.click(renameButton)
      })

      // The payload should reflect the current state, not stale values
      expect(mockBatchRenameTorrentFiles).toHaveBeenCalled()
      const calledWith = mockBatchRenameTorrentFiles.mock.calls[0][1] as any[]
      
      // Verify the payload contains the updated entries
      expect(calledWith).toHaveLength(2)
      expect(calledWith[0].filename).toContain('Testing.Bad.01')
      expect(calledWith[1].filename).toContain('Testing.Bad.02')
    })

    it('should handle regex mode correctly', async () => {
      const torrent = createTestTorrent('Testing.Bad.S01', 2)
      const videoFilenames = [
        'Testing.Bad.S01/Testing.Bad.01.720p.WEB.x264-ABC[0].mkv',
        'Testing.Bad.S01/Testing.Bad.02.720p.WEB.x264-ABC[1].mkv',
      ]
      mockGetShowVideoFilenames.mockReturnValue(videoFilenames)

      await act(async () => {
        render(<RenameTVShowView torrent={torrent} />)
      })

      // Type a regex pattern that produces unique replacements
      const patternInput = screen.getAllByRole('textbox')[0]
      await act(async () => {
        fireEvent.change(patternInput, { target: { value: '\\[0\\]' } })
      })

      // Type a replacement
      const replacementInput = screen.getAllByRole('textbox')[1]
      await act(async () => {
        fireEvent.change(replacementInput, { target: { value: 'XXX' } })
      })

      // Enable regex mode
      const regexIcon = screen.getByTestId('regex-icon')
      await act(async () => {
        fireEvent.pointerDown(regexIcon)
        fireEvent.pointerUp(regexIcon)
        fireEvent.click(regexIcon)
      })

      // Trigger rename
      const renameButton = screen.getByText('Rename')
      
      await act(async () => {
        fireEvent.click(renameButton)
      })

      // Verify batchRenameTorrentFiles was called
      expect(mockBatchRenameTorrentFiles).toHaveBeenCalled()
    })

    it('should handle replace-all mode correctly', async () => {
      const torrent = createTestTorrent('Testing.Bad.S01', 2)
      const videoFilenames = [
        'Testing.Bad.S01/Testing.Bad.01.720p.WEB.x264-ABC[0].mkv',
        'Testing.Bad.S01/Testing.Bad.02.720p.WEB.x264-ABC[1].mkv',
      ]
      mockGetShowVideoFilenames.mockReturnValue(videoFilenames)

      await act(async () => {
        render(<RenameTVShowView torrent={torrent} />)
      })

      // Type a pattern
      const patternInput = screen.getAllByRole('textbox')[0]
      await act(async () => {
        fireEvent.change(patternInput, { target: { value: 'Bad' } })
      })

      // Type a replacement
      const replacementInput = screen.getAllByRole('textbox')[1]
      await act(async () => {
        fireEvent.change(replacementInput, { target: { value: 'Show' } })
      })

      // Enable replace-all mode (uses ReplaceIcon)
      const replaceIcon = screen.getByTestId('replace-icon')
      await act(async () => {
        fireEvent.pointerDown(replaceIcon)
        fireEvent.pointerUp(replaceIcon)
        fireEvent.click(replaceIcon)
      })

      // Trigger rename
      const renameButton = screen.getByText('Rename')
      
      await act(async () => {
        fireEvent.click(renameButton)
      })

      // Verify batchRenameTorrentFiles was called
      expect(mockBatchRenameTorrentFiles).toHaveBeenCalled()
    })
  })

  describe('Stale Closure Prevention', () => {
    it('should use entriesRef.current instead of stale closure values', async () => {
      const torrent = createTestTorrent('Testing.Bad.S01', 2)
      const videoFilenames = [
        'Testing.Bad.S01/Testing.Bad.01.720p.WEB.x264-ABC[0].mkv',
        'Testing.Bad.S01/Testing.Bad.02.720p.WEB.x264-ABC[1].mkv',
      ]
      mockGetShowVideoFilenames.mockReturnValue(videoFilenames)

      const { rerender } = await act(async () => {
        return render(<RenameTVShowView torrent={torrent} />)
      })

      // Type a pattern
      const patternInput = screen.getAllByRole('textbox')[0]
      await act(async () => {
        fireEvent.change(patternInput, { target: { value: 'Bad' } })
      })

      // Type a replacement
      const replacementInput = screen.getAllByRole('textbox')[1]
      await act(async () => {
        fireEvent.change(replacementInput, { target: { value: 'Show' } })
      })

      // Rerender with a new torrent prop (simulating prop change)
      const newTorrent = createTestTorrent('Testing.Bad.S02', 2)
      newTorrent.files = [
        'Testing.Bad.S02/Testing.Bad.01.720p.WEB.x264-ABC[0].mkv',
        'Testing.Bad.S02/Testing.Bad.02.720p.WEB.x264-ABC[1].mkv',
      ].map((f) => [f, 500000000, 250000000, 0, false, 0] as any)
      mockGetShowVideoFilenames.mockReturnValue([
        'Testing.Bad.S02/Testing.Bad.01.720p.WEB.x264-ABC[0].mkv',
        'Testing.Bad.S02/Testing.Bad.02.720p.WEB.x264-ABC[1].mkv',
      ])

      await act(async () => {
        rerender(<RenameTVShowView torrent={newTorrent} />)
      })

      // Trigger rename
      const renameButton = screen.getByText('Rename')
      
      await act(async () => {
        fireEvent.click(renameButton)
      })

      // The payload should use the latest entries, not stale closure values
      expect(mockBatchRenameTorrentFiles).toHaveBeenCalled()
      const calledWith = mockBatchRenameTorrentFiles.mock.calls[0][1] as any[]
      
      // Verify the payload contains the updated entries (S02, not S01)
      expect(calledWith).toHaveLength(2)
      expect(calledWith[0].filename).toContain('Testing.Bad.S02')
      expect(calledWith[1].filename).toContain('Testing.Bad.S02')
    })

    it('should handle rapid state updates before long-press completes', async () => {
      const torrent = createTestTorrent('Testing.Bad.S01', 3)
      const videoFilenames = [
        'Testing.Bad.S01/Testing.Bad.01.720p.WEB.x264-ABC[0].mkv',
        'Testing.Bad.S01/Testing.Bad.02.720p.WEB.x264-ABC[1].mkv',
        'Testing.Bad.S01/Testing.Bad.03.720p.WEB.x264-ABC[2].mkv',
      ]
      mockGetShowVideoFilenames.mockReturnValue(videoFilenames)

      await act(async () => {
        render(<RenameTVShowView torrent={torrent} />)
      })

      // Rapidly change pattern multiple times — use a non-regex pattern
      // that actually matches the filenames so changed.length > 0
      const patternInput = screen.getAllByRole('textbox')[0]
      await act(async () => {
        fireEvent.change(patternInput, { target: { value: 'Bad' } })
      })
      await act(async () => {
        fireEvent.change(patternInput, { target: { value: 'Show' } })
      })
      await act(async () => {
        fireEvent.change(patternInput, { target: { value: 'Bad' } })
      })

      // Type a replacement
      const replacementInput = screen.getAllByRole('textbox')[1]
      await act(async () => {
        fireEvent.change(replacementInput, { target: { value: 'XXX' } })
      })

      // Trigger rename immediately after rapid changes
      const renameButton = screen.getByText('Rename')
      
      await act(async () => {
        fireEvent.click(renameButton)
      })

      // The payload should reflect the latest state, not intermediate values
      expect(mockBatchRenameTorrentFiles).toHaveBeenCalled()
      const calledWith = mockBatchRenameTorrentFiles.mock.calls[0][1] as any[]
      
      // Verify the payload contains the latest entries
      expect(calledWith).toHaveLength(3)
      expect(calledWith[0].filename).toContain('Testing.Bad.01')
      expect(calledWith[1].filename).toContain('Testing.Bad.02')
      expect(calledWith[2].filename).toContain('Testing.Bad.03')
    })
  })

  describe('Multiple Seasons', () => {
    it('should handle S01 torrent correctly', async () => {
      const torrent = createTestTorrent('Testing.Bad.S01', 4)
      const videoFilenames = [
        'Testing.Bad.S01/Testing.Bad.01.720p.WEB.x264-ABC[0].mkv',
        'Testing.Bad.S01/Testing.Bad.02.720p.WEB.x264-ABC[1].mkv',
        'Testing.Bad.S01/Testing.Bad.03.720p.WEB.x264-ABC[2].mkv',
        'Testing.Bad.S01/Testing.Bad.04.720p.WEB.x264-ABC[3].mkv',
      ]
      mockGetShowVideoFilenames.mockReturnValue(videoFilenames)

      await act(async () => {
        render(<RenameTVShowView torrent={torrent} />)
      })

      // Type a pattern
      const patternInput = screen.getAllByRole('textbox')[0]
      await act(async () => {
        fireEvent.change(patternInput, { target: { value: 'Bad' } })
      })

      // Type a replacement
      const replacementInput = screen.getAllByRole('textbox')[1]
      await act(async () => {
        fireEvent.change(replacementInput, { target: { value: 'Show' } })
      })

      // Trigger rename
      const renameButton = screen.getByText('Rename')
      
      await act(async () => {
        fireEvent.click(renameButton)
      })

      // Verify batchRenameTorrentFiles was called with correct payload
      expect(mockBatchRenameTorrentFiles).toHaveBeenCalledWith(
        torrent,
        expect.arrayContaining([
          expect.objectContaining({
            filename: expect.stringContaining('Testing.Bad.01'),
            newname: expect.any(String),
          }),
          expect.objectContaining({
            filename: expect.stringContaining('Testing.Bad.02'),
            newname: expect.any(String),
          }),
          expect.objectContaining({
            filename: expect.stringContaining('Testing.Bad.03'),
            newname: expect.any(String),
          }),
          expect.objectContaining({
            filename: expect.stringContaining('Testing.Bad.04'),
            newname: expect.any(String),
          }),
        ])
      )
    })

    it('should handle S02 torrent correctly', async () => {
      const torrent = createTestTorrent('Testing.Bad.S02', 3)
      const videoFilenames = [
        'Testing.Bad.S02/Testing.Bad.01.720p.WEB.x264-ABC[0].mkv',
        'Testing.Bad.S02/Testing.Bad.02.720p.WEB.x264-ABC[1].mkv',
        'Testing.Bad.S02/Testing.Bad.03.720p.WEB.x264-ABC[2].mkv',
      ]
      mockGetShowVideoFilenames.mockReturnValue(videoFilenames)

      await act(async () => {
        render(<RenameTVShowView torrent={torrent} />)
      })

      // Type a pattern
      const patternInput = screen.getAllByRole('textbox')[0]
      await act(async () => {
        fireEvent.change(patternInput, { target: { value: 'Bad' } })
      })

      // Type a replacement
      const replacementInput = screen.getAllByRole('textbox')[1]
      await act(async () => {
        fireEvent.change(replacementInput, { target: { value: 'Show' } })
      })

      // Trigger rename
      const renameButton = screen.getByText('Rename')
      
      await act(async () => {
        fireEvent.click(renameButton)
      })

      // Verify batchRenameTorrentFiles was called with correct payload
      expect(mockBatchRenameTorrentFiles).toHaveBeenCalledWith(
        torrent,
        expect.arrayContaining([
          expect.objectContaining({
            filename: expect.stringContaining('Testing.Bad.01'),
            newname: expect.any(String),
          }),
          expect.objectContaining({
            filename: expect.stringContaining('Testing.Bad.02'),
            newname: expect.any(String),
          }),
          expect.objectContaining({
            filename: expect.stringContaining('Testing.Bad.03'),
            newname: expect.any(String),
          }),
        ])
      )
    })
  })
})
