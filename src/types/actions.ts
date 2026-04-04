type DestructiveDownloadedFileAction =
'files/delete' |
'files/move/movies' |
'files/move/tvshows' |
'files/move/books' |
'files/move/audiobooks' |
'files/move/music' |
'files/move/software'

type DestructiveTorrentAction = 'remove' | 'delete'

export type {
  DestructiveDownloadedFileAction,
  DestructiveTorrentAction
}
