import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Torrent } from "@/types/torrent";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function notifyCompletion(
    torrent: Torrent,
    // from /public/
    sound: string = '/sounds/torrent-finished.mp3'
) {
    const key = `torrent_completed_${torrent.id}`;
    const isNotified = localStorage.getItem(key);

    if (torrent.percent === 100 && !isNotified) {
        // Check if it's the first run
        const isFirstRun = localStorage.getItem('first_run') === null;

        if (!isFirstRun) {
            try {
                const player = new Audio(sound);
                player.play();
            } catch (e) {
                console.log("Could not play torrent finished sound")
            }
        }

        // Mark this torrent as notified
        localStorage.setItem(key, 'true');

        // Set the first run flag to false
        if (isFirstRun) {
            localStorage.setItem('first_run', 'false');
        }
    }
}