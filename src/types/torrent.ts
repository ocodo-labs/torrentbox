import type { Dispatch, SetStateAction } from "react";

export type TorrentFile = [string, number, number, number, boolean, number];

export interface Torrent {
    id: string;
    name: string;
    percent: number;
    files: TorrentFile[];
    speed: number;
    total: number;
    stats: TrackerStatsFields[];
    ratio: number;
    downloadRate: number;
    uploadRate: number;
    secondsDownloading: number;
    magnet: string;
}

export interface TransmissionData {
    downloaded: string[];
    downloading: Torrent[];
}

export interface TrackerStatsFields {
  fields: TrackerStats;
}

export interface TrackerStats {
		announce: string;
		announceState: number;
		downloadCount: number;
		hasAnnounced: boolean;
		hasScraped: boolean;
		host: string;
		id: number;
		isBackup: boolean;
		lastAnnouncePeerCount: number;
		lastAnnounceResult: string;
		lastAnnounceStartTime: number;
		lastAnnounceSucceeded: boolean;
		lastAnnounceTime: number;
		lastAnnounceTimedOut: boolean;
		lastScrapeResult: string;
		lastScrapeStartTime: number;
		lastScrapeSucceeded: boolean;
		lastScrapeTime: number;
		lastScrapeTimedOut: boolean;
		leecherCount: number;
		nextAnnounceTime: number;
		nextScrapeTime: number;
		scrape: string;
		scrapeState: number;
		seederCount: number;
		tier: number;
}

export interface MoveToStorageProps {
  setMoveType: Dispatch<SetStateAction<MoveType>>;
  moveType: MoveType;
  setFileMoving: Dispatch<SetStateAction<boolean>>;
  fileMoving: boolean;
  file: string;
}

export type MoveType =
  'tv' |
  'movie' |
  'book' |
  'audiobook' |
  'music' |
  'software' |
  undefined |
  null

