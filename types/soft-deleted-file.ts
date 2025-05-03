interface ISoftDeletedFile {
  torrent: string
  fileIndex: number
}

class SoftDeletedFile implements ISoftDeletedFile {
  torrent: string
  fileIndex: number

  constructor(torrent: string, fileIndex: number) {
    this.torrent = torrent
    this.fileIndex = fileIndex
  }

  isEqual(torrent: string, fileIndex: number): boolean {
    return this.torrent == torrent && this.fileIndex == fileIndex
  }
}

export { SoftDeletedFile }

export type { ISoftDeletedFile }