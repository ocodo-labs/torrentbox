class Torrent {
    id: string;
    name: string;
    percent: number;
    files: [string, number, number, number, boolean, number][];
    speed: number;
    constructor({
        id,
        name,
        percent,
        files,
        speed,
    }: {
        id: string;
        name: string;
        percent: number;
        files: [string, number, number, number, boolean, number][];
        speed: number;
    }) {
        this.id = id;
        this.name = name;
        this.percent = percent;
        this.files = files;
        this.speed = speed;
    }
}

class TorrentData {
    downloaded: string[] = []
    downloading: Torrent[] = []
}

export {
    Torrent,
    TorrentData,
}
