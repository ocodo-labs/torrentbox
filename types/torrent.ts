export type TorrentFile = [string, number, number, number, boolean, number];

export class Torrent {
    id: string;
    name: string;
    percent: number;
    files: TorrentFile[];
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
        files: TorrentFile[];
        speed: number;
    }) {
        this.id = id;
        this.name = name;
        this.percent = percent;
        this.files = files;
        this.speed = speed;
    }
}

export class TransmissionData {
    downloaded: string[] = []
    downloading: Torrent[] = []
}
