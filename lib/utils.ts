import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Torrent } from "@/types/torrent"
import canAutoplay from "can-autoplay"

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
  const isFirstRun = localStorage.getItem('first_run') === null;

  if (torrent.percent === 100 && !isNotified) {
    if (!isFirstRun) {
      canAutoplay.audio().then(({ result }: { result: boolean }) => {
        if (result === true) {
          const player = new Audio(sound);
          player.play();
        }
      })
    }
  }

  // Mark this torrent as notified
  localStorage.setItem(key, 'true');

  // Set the first run flag to false
  if (isFirstRun) {
    localStorage.setItem('first_run', 'false');
  }
}
