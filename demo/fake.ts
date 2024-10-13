import { Torrent } from '@/types/torrent'

const generateFakeTorrents = (): Torrent[] => {
    return [
        {
            id: '1',
            name: 'Awesome Movie 2023',
            percent: 75,
            files: [
                ['awesome_movie_2023.mp4', 1500000000, 1125000000, 1, true, 1],
                ['subtitles_en.srt', 50000, 50000, 1, true, 2],
            ],
        },
        {
            id: '2',
            name: 'Cool TV Show S01E01',
            percent: 30,
            files: [
                ['cool_tv_show_s01e01.mkv', 800000000, 240000000, 1, true, 1],
            ],
        },
        {
            id: '3',
            name: 'Amazing Album 2023',
            percent: 100,
            files: [
                ['01_track_one.mp3', 10000000, 10000000, 1, true, 1],
                ['02_track_two.mp3', 9000000, 9000000, 1, true, 2],
                ['03_track_three.mp3', 11000000, 11000000, 1, true, 3],
            ],
        },
    ]
}

const generateFakeDownloaded = (): string[] => {
    return [
        'Completed Movie 2022',
        'Finished TV Show S02E05',
        'Downloaded Album 2023',
    ]
}

const generateFakeSuggestions = (filename: string): string[] => {
    return [
        filename.replace(/\d{4}/, '2023'),
        filename.replace(/\s/g, '.'),
        filename.toLowerCase(),
        filename.toUpperCase(),
    ]
}

export {
    generateFakeDownloaded,
    generateFakeTorrents,
    generateFakeSuggestions
}
