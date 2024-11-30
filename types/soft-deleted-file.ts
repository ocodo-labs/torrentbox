class SoftDeletedFile {
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