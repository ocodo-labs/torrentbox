
class Torrent {
    id: string;
    name: string;
    percent: number;
    files: [string, number, number, number, boolean, number][];

    constructor({
        id,
        name,
        percent,
        files,
    }: {
        id: string;
        name: string;
        percent: number;
        files: [string, number, number, number, boolean, number][];
    }) {
        this.id = id;
        this.name = name;
        this.percent = percent;
        this.files = files;
    }

    notifyCompletion() {
        const key = `torrent_completed_${this.id}`;
        const isNotified = localStorage.getItem(key);

        if (this.percent === 100 && !isNotified) {
            // Check if it's the first run
            const isFirstRun = localStorage.getItem('first_run') === null;

            if (!isFirstRun) {
                // Play the "ding" sound
                console.log(`ding: ${this.id}`)
                const player = new Audio('/sounds/torrent-finished.mp3');
                player.play();
            }

            // Mark this torrent as notified
            localStorage.setItem(key, 'true');

            // Set the first run flag to false
            if (isFirstRun) {
                localStorage.setItem('first_run', 'false');
            }
        }
    }
}

interface TorrentData {
    downloaded: string[]
    downloading: Torrent[]
}

export {
    Torrent,
    TorrentData,
}
