import mime from "mime";
import config from "./media_rename_config.json";

export interface RenameSuggestion {
  name: string;
  media_type: "movie" | "tv" | "unknown";
  extension?: string;
  type?: string;
  year?: string;
  season?: number;
  episode?: number;
  matched_pattern?: string;
}

export interface RenameConfig {
  separators: string[];
  patterns: {
    tv: {
      season_episode: string;
    };
    movie: {
      year: string;
    };
  };
  noise: Record<string, string[]>;
  noise_patterns: string[];
  extensions: {
    video: string[];
    subtitle: string[];
    other_extensions?: string;
  };
  classification: {
    precedence: string[];
  };
  formatting: {
    title: {
      capitalize_words: boolean;
      collapse_whitespace: boolean;
      strip_whitespace: boolean;
    };
    movie: {
      year: {
        enabled: boolean;
        prefix: string;
        suffix: string;
      };
    };
    tv: {
      season_prefix: string;
      episode_prefix: string;
      season_digits: number;
      episode_digits: number;
    };
  };
  behavior: {
    normalize_separators: boolean;
    title_boundary_on_positive_match: boolean;
    remove_noise_before_positive_match: boolean;
    tv_before_year: boolean;
    year_without_episode_is_movie: boolean;
    preserve_extension: boolean;
    subtitle_follows_media_name: boolean;
  };
}

const renameConfig = config as RenameConfig;

const videoExtensions = new Set(
  renameConfig.extensions.video.map((x) => x.toLowerCase()),
);

const subtitleExtensions = new Set(
  renameConfig.extensions.subtitle.map((x) => x.toLowerCase()),
);

const noiseTokens = new Set(
  Object.values(renameConfig.noise)
    .flat()
    .map((x) => x.toLowerCase()),
);

const noisePatterns = renameConfig.noise_patterns.map(
  (pattern) => new RegExp(pattern, "gi"),
);

const seasonEpisodeRegex = new RegExp(
  renameConfig.patterns.tv.season_episode,
  "i",
);

const yearRegex = new RegExp(renameConfig.patterns.movie.year);

function extensionOf(filename: string): string | undefined {
  const match = filename.match(/\.([^.]+)$/);

  if (!match) {
    return undefined;
  }

  const extension = match[1].toLowerCase();

  if (
    videoExtensions.has(extension) ||
    subtitleExtensions.has(extension) ||
    mime.getType(extension)
  ) {
    return extension;
  }

  return undefined;
}

function stripExtension(filename: string): {
  basename: string;
  extension?: string;
} {
  const extension = extensionOf(filename);

  if (!extension) {
    return { basename: filename };
  }

  return {
    basename: filename.slice(0, -(extension.length + 1)),
    extension,
  };
}

function normalizeSeparators(value: string): string {
  let result = value;

  for (const separator of renameConfig.separators) {
    result = result.split(separator).join(" ");
  }

  return result.replace(/\s+/g, " ").trim();
}

function removeNoise(value: string): string {
  let result = value;

  /*
   * Remove configured regex noise first. These patterns describe things
   * such as 1080p, 5.1, 23.976fps, etc.
   */
  for (const pattern of noisePatterns) {
    result = result.replace(pattern, " ");
  }

  /*
   * Configured noise values are tokens, not arbitrary substrings.
   *
   * This is important: "WEB" may be noise, but it must never turn
   * "The Web" or an ordinary word containing those characters into garbage.
   */
  const tokens = normalizeSeparators(result)
    .split(" ")
    .filter(Boolean);

  const kept: string[] = [];

  for (const token of tokens) {
    if (!noiseTokens.has(token.toLowerCase())) {
      kept.push(token);
    }
  }

  return kept.join(" ");
}

function capitalizeWords(value: string): string {
  if (!renameConfig.formatting.title.capitalize_words) {
    return value;
  }

  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      if (!word) return word;

      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function cleanTitle(value: string): string {
  let result = value;

  if (renameConfig.behavior.normalize_separators) {
    result = normalizeSeparators(result);
  }

  result = result.replace(/\s+/g, " ").trim();

  if (renameConfig.formatting.title.collapse_whitespace) {
    result = result.replace(/\s+/g, " ");
  }

  if (renameConfig.formatting.title.strip_whitespace) {
    result = result.trim();
  }

  return capitalizeWords(result);
}

function formatTvMarker(season: number, episode: number): string {
  const seasonText = String(season).padStart(
    renameConfig.formatting.tv.season_digits,
    "0",
  );

  const episodeText = String(episode).padStart(
    renameConfig.formatting.tv.episode_digits,
    "0",
  );

  return `${renameConfig.formatting.tv.season_prefix}${seasonText}${renameConfig.formatting.tv.episode_prefix}${episodeText}`;
}

function getMimeType(extension?: string): string | undefined {
  if (!extension) {
    return undefined;
  }

  return mime.getType(extension) ?? undefined;
}

function buildSuggestion(
  name: string,
  mediaType: RenameSuggestion["media_type"],
  extension: string | undefined,
  extra: Partial<RenameSuggestion> = {},
): RenameSuggestion {
  return {
    name,
    media_type: mediaType,
    extension,
    type: getMimeType(extension),
    ...extra,
  };
}

function suggestMovie(
  basename: string,
  extension?: string,
): RenameSuggestion | undefined {
  const yearMatch = basename.match(yearRegex);

  if (!yearMatch?.groups?.year) {
    return undefined;
  }

  const year = yearMatch.groups.year;

  /*
   * The movie title is everything before the year.
   *
   * This is deliberately done before noise removal so that release
   * metadata after the year cannot become part of the title.
   */
  const beforeYear = basename.slice(0, yearMatch.index ?? 0);
  const title = cleanTitle(removeNoise(beforeYear));

  if (!title) {
    return undefined;
  }

  const movieName = renameConfig.formatting.movie.year.enabled
    ? `${title}${renameConfig.formatting.movie.year.prefix}${year}${renameConfig.formatting.movie.year.suffix}`
    : title;

  return buildSuggestion(
    `${movieName}${extension ? `.${extension}` : ""}`,
    "movie",
    extension,
    {
      year,
      matched_pattern: "movie.year",
    },
  );
}

function suggestTv(
  basename: string,
  extension?: string,
): RenameSuggestion | undefined {
  const match = basename.match(seasonEpisodeRegex);

  if (
    !match?.groups?.season ||
    !match.groups.episode ||
    match.index === undefined
  ) {
    return undefined;
  }

  const season = Number(match.groups.season);
  const episode = Number(match.groups.episode);

  /*
   * Title is everything before SxxExx.
   *
   * Anything after the positive match is release metadata unless there
   * is a genuine episode-title portion. The engine keeps meaningful text
   * following the marker while removing configured noise.
   */
  const before = basename.slice(0, match.index);
  const after = basename.slice(match.index + match[0].length);

  const title = cleanTitle(removeNoise(before));
  const episodeTitle = cleanTitle(removeNoise(after));

  if (!title) {
    return undefined;
  }

  const marker = formatTvMarker(season, episode);

  const nameParts = [title, marker];

  if (episodeTitle) {
    nameParts.push(episodeTitle);
  }

  const name = `${nameParts.join(" ")}${extension ? `.${extension}` : ""}`;

  return buildSuggestion(name, "tv", extension, {
    season,
    episode,
    matched_pattern: "tv.season_episode",
  });
}

function suggestUnknown(
  basename: string,
  extension?: string,
): RenameSuggestion {
  /*
   * Unknown files still get separator cleanup, but we do NOT run semantic
   * movie/TV noise stripping against them.
   */
  const title = cleanTitle(basename);

  return buildSuggestion(
    `${title}${extension ? `.${extension}` : ""}`,
    "unknown",
    extension,
  );
}

export class MediaRenameEngine {
  private readonly config: RenameConfig;

  constructor(engineConfig: RenameConfig = renameConfig) {
    this.config = engineConfig;
  }

  suggestRename(filename: string): RenameSuggestion[] {
    if (typeof filename !== "string") {
      throw new TypeError("filename must be a string");
    }

    const input = filename.trim();

    if (!input) {
      return [];
    }

    const { basename, extension } = stripExtension(input);

    /*
     * TV gets precedence over movie when both markers occur.
     */
    if (this.config.behavior.tv_before_year) {
      const tv = suggestTv(basename, extension);

      if (tv) {
        return [tv];
      }
    }

    if (this.config.behavior.year_without_episode_is_movie) {
      const movie = suggestMovie(basename, extension);

      if (movie) {
        return [movie];
      }
    }

    return [suggestUnknown(basename, extension)];
  }
}

const defaultEngine = new MediaRenameEngine();

export function suggestRename(filename: string): RenameSuggestion[] {
  return defaultEngine.suggestRename(filename);
}

