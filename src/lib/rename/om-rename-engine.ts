import mime from "mime";
import config from "./om_rename_config.json";

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

const extensionOf = (
  filename: string,
  config: RenameConfig,
): string | undefined => {
  const match = filename.match(/\.([^.]+)$/);

  if (!match) {
    return undefined;
  }

  const extension = match[1].toLowerCase();

  const videoExtensions = new Set(
    config.extensions.video.map((x) => x.toLowerCase()),
  );

  const subtitleExtensions = new Set(
    config.extensions.subtitle.map((x) => x.toLowerCase()),
  );

  if (
    videoExtensions.has(extension) ||
    subtitleExtensions.has(extension) ||
    mime.getType(extension)
  ) {
    return extension;
  }

  return undefined;
};

const basenameOfPath = (value: string): string =>
  value.replace(/[\\/]+$/, "").split(/[\\/]/).pop() ?? "";

const stripExtension = (
  filename: string,
  config: RenameConfig,
): {
  basename: string;
  extension?: string;
} => {
  const basename = basenameOfPath(filename);
  const extension = extensionOf(basename, config);

  if (!extension) {
    return { basename };
  }

  return {
    basename: basename.slice(0, -(extension.length + 1)),
    extension,
  };
};

const normalizeSeparators = (
  value: string,
  config: RenameConfig,
): string => {
  let result = value;

  for (const separator of config.separators) {
    result = result.split(separator).join(" ");
  }

  return result.replace(/\s+/g, " ").trim();
};

const removeNoise = (
  value: string,
  config: RenameConfig,
): string => {
  /*
   * Noise marks the beginning of the noise suffix.
   *
   * Once any configured regex pattern or noise token is encountered,
   * everything from that point onward is considered noise and discarded.
   *
   * Keep these definitions conservative: a false positive destroys the
   * remainder of the title.
   */
  let result = value;

  const noisePatterns = config.noise_patterns.map(
    (pattern) => new RegExp(pattern, "gi"),
  );

  for (const pattern of noisePatterns) {
    const match = result.match(pattern);

    if (match?.index !== undefined) {
      result = result.slice(0, match.index);
    }
  }

  const noiseTokens = new Set(
    Object.values(config.noise)
      .flat()
      .map((x) => x.toLowerCase()),
  );

  const tokens = normalizeSeparators(result, config)
    .split(" ")
    .filter(Boolean);

  const firstNoiseToken = tokens.findIndex((token) =>
    noiseTokens.has(token.toLowerCase()),
  );

  return tokens
    .slice(0, firstNoiseToken === -1 ? tokens.length : firstNoiseToken)
    .join(" ");
};

const capitalizeWords = (
  value: string,
  config: RenameConfig,
): string => {
  if (!config.formatting.title.capitalize_words) {
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
};

const cleanTitle = (
  value: string,
  config: RenameConfig,
): string => {
  let result = value;

  if (config.behavior.normalize_separators) {
    result = normalizeSeparators(result, config);
  }

  result = result.replace(/\s+/g, " ").trim();

  if (config.formatting.title.collapse_whitespace) {
    result = result.replace(/\s+/g, " ");
  }

  if (config.formatting.title.strip_whitespace) {
    result = result.trim();
  }

  return capitalizeWords(result, config);
};

const formatTvMarker = (
  season: number,
  episode: number,
  config: RenameConfig,
): string => {
  const seasonText = String(season).padStart(
    config.formatting.tv.season_digits,
    "0",
  );

  const episodeText = String(episode).padStart(
    config.formatting.tv.episode_digits,
    "0",
  );

  return `${config.formatting.tv.season_prefix}${seasonText}${config.formatting.tv.episode_prefix}${episodeText}`;
};

const getMimeType = (
  extension?: string,
): string | undefined => {
  if (!extension) {
    return undefined;
  }

  return mime.getType(extension) ?? undefined;
};

const buildSuggestion = (
  name: string,
  mediaType: RenameSuggestion["media_type"],
  extension: string | undefined,
  extra: Partial<RenameSuggestion> = {},
): RenameSuggestion => {
  return {
    name,
    media_type: mediaType,
    extension,
    type: getMimeType(extension),
    ...extra,
  };
};

const findMovieYear = (
  basename: string,
  config: RenameConfig,
): { year: string; index: number; title: string } | undefined => {
  const yearRegex = new RegExp(config.patterns.movie.year, "g");
  const matches = [...basename.matchAll(yearRegex)];

  for (const match of matches) {
    if (!match.groups?.year || match.index === undefined) {
      continue;
    }

    const beforeYear = basename.slice(0, match.index);
    const title = cleanTitle(
      removeNoise(beforeYear, config),
      config,
    );

    if (title) {
      return {
        year: match.groups.year,
        index: match.index,
        title,
      };
    }
  }

  return undefined;
};

const suggestMovie = (
  basename: string,
  extension: string | undefined,
  config: RenameConfig,
): RenameSuggestion | undefined => {
  const yearMatch = findMovieYear(basename, config);

  if (yearMatch) {
    const movieName = config.formatting.movie.year.enabled
      ? `${yearMatch.title}${config.formatting.movie.year.prefix}${yearMatch.year}${config.formatting.movie.year.suffix}`
      : yearMatch.title;

    const finalName =
      config.behavior.preserve_extension && extension
        ? `${movieName}.${extension}`
        : movieName;

    return buildSuggestion(finalName, "movie", extension, {
      year: yearMatch.year,
      matched_pattern: "movie.year",
    });
  }

  const cleaned = cleanTitle(
    removeNoise(basename, config),
    config,
  );

  const normalized = cleanTitle(basename, config);
  const noiseRemoved = cleaned !== normalized;

  const videoExtensions = new Set(
    config.extensions.video.map((x) => x.toLowerCase()),
  );

  const isVideo = extension
    ? videoExtensions.has(extension.toLowerCase())
    : false;

  if (!cleaned || (!noiseRemoved && !isVideo)) {
    return undefined;
  }

  const finalName =
    config.behavior.preserve_extension && extension
      ? `${cleaned}.${extension}`
      : cleaned;

  return buildSuggestion(finalName, "movie", extension, {
    matched_pattern: "movie.no_year",
  });
};

const suggestTv = (
  basename: string,
  extension: string | undefined,
  config: RenameConfig,
): RenameSuggestion | undefined => {
  const seasonEpisodeRegex = new RegExp(
    config.patterns.tv.season_episode,
    "i",
  );

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

  const title = cleanTitle(removeNoise(before, config), config);
  const episodeTitle = cleanTitle(removeNoise(after, config), config);

  if (!title) {
    return undefined;
  }

  const marker = formatTvMarker(season, episode, config);

  const nameParts = [title, marker];

  if (episodeTitle) {
    nameParts.push(episodeTitle);
  }

  const name = nameParts.join(" ");

  const finalName = config.behavior.preserve_extension && extension
    ? `${name}.${extension}`
    : name;

  return buildSuggestion(
    finalName,
    "tv",
    extension,
    {
      season,
      episode,
      matched_pattern: "tv.season_episode",
    },
  );
};

const suggestUnknown = (
  basename: string,
  extension: string | undefined,
  config: RenameConfig,
): RenameSuggestion => {
  /*
   * Unknown files still get separator cleanup, but we do NOT run semantic
   * movie/TV noise stripping against them.
   */
  const title = cleanTitle(basename, config);

  const finalName = config.behavior.preserve_extension && extension
    ? `${title}.${extension}`
    : title;

  return buildSuggestion(
    finalName,
    "unknown",
    extension,
  );
};

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

    const { basename, extension } = stripExtension(
      input,
      this.config,
    );

    /*
     * TV gets precedence over movie when both markers occur.
     */
    if (this.config.behavior.tv_before_year) {
      const tv = suggestTv(
        basename,
        extension,
        this.config,
      );

      if (tv) {
        return [tv];
      }
    }

    if (this.config.behavior.year_without_episode_is_movie) {
      const movie = suggestMovie(
        basename,
        extension,
        this.config,
      );

      if (movie) {
        return [movie];
      }
    }

    return [
      suggestUnknown(
        basename,
        extension,
        this.config,
      ),
    ];
  }
}

const defaultEngine = new MediaRenameEngine();

export const suggestRename = (
  filename: string,
): RenameSuggestion[] => {
  return defaultEngine.suggestRename(filename);
};
