import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Mock modules that aren't relevant to component tests
vi.mock('@/config', () => ({
  json_header: { 'Content-Type': 'application/json' },
  serverBaseUrl: 'http://localhost:9091',
}))

vi.mock('@/lib/play-sound', () => ({
  playSound: vi.fn(() => Promise.resolve()),
}))

vi.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' '),
  notifyCompletion: vi.fn(),
}))

vi.mock('@/components/ui/input', () => ({
  Input: ({ className, ...props }: any) => {
    const React = require('react')
    return React.createElement('input', { className, ...props })
  },
}))

vi.mock('@/components/tooltip-compact', () => ({
  TooltipCompact: ({ children, tooltipChildren }: any) => {
    const React = require('react')
    return React.createElement('div', { 'data-tooltip': tooltipChildren }, children)
  },
}))

vi.mock('@/components/long-press-tooltip-button', () => ({
  LongPressTooltipButton: ({ children, onLongPress, onClick, ...props }: any) => {
    const React = require('react')
    return React.createElement('button', { 
      ...props, 
      onLongPress, 
      onClick: (e: any) => {
        if (onClick) onClick(e)
        if (onLongPress) onLongPress()
      }
    }, children)
  },
}))

vi.mock('@/components/long-press-async-job-tooltip-button', () => ({
  LongPressAsyncJobTooltipButton: ({ children, onLongPress, onClick, ...props }: any) => {
    const React = require('react')
    return React.createElement('button', { 
      ...props, 
      onLongPress, 
      onClick: (e: any) => {
        if (onClick) onClick(e)
        if (onLongPress) onLongPress()
      }
    }, children)
  },
}))

vi.mock('lucide-react', () => ({
  RegexIcon: () => {
    const React = require('react')
    return React.createElement('div', { 'data-testid': 'regex-icon' })
  },
  ReplaceAllIcon: () => {
    const React = require('react')
    return React.createElement('div', { 'data-testid': 'replace-all-icon' })
  },
  ReplaceIcon: () => {
    const React = require('react')
    return React.createElement('div', { 'data-testid': 'replace-icon' })
  },
}))

vi.mock('@/lib/rename/om-rename-engine', () => ({
  suggestRename: (filename: string) => [{
    name: filename.replace(/[-_. ]+/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
    media_type: 'tv' as const,
    extension: 'mkv',
  }],
}))
