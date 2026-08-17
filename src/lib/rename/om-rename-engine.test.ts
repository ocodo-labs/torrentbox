import { describe, expect, it } from "vitest";

import {
  suggestRename,
  MediaRenameEngine,
} from "./om-rename-engine";

describe("om_rename_engine", () => {

  describe("path input", () => {

    it("handles a movie file path", () => {
      const result = suggestRename(
        "Some Movie (2020)/some.movie.2020.1080p.h264.webrip.mkv",
      );

      expect(result[0]?.name).toBe("Some Movie (2020).mkv");
    });

    it("handles a nested movie path without an extension", () => {
      const result = suggestRename(
        "Some Movie (2020)/some.movie.2020.1080p.h264.webrip/",
      );

      expect(result[0]?.name).toBe("Some Movie (2020)");
    });

    it("returns a filename rather than a path for a TV episode", () => {
      const result = suggestRename(
        "Some Show/Season 02/some.show.s02e03.1080p.mkv",
      );

      expect(result[0]?.name).toBe("Some Show S02E03.mkv");
    });
  });

  describe("movies", () => {

    it("handles a movie title that is itself a year (1971)", () => {
      const result = suggestRename(
        "1971.1080p.BluRay.x264.mkv",
      );

      expect(result[0]).toEqual(
        expect.objectContaining({
          name: "1971.mkv",
          media_type: "movie",
          extension: "mkv",
          matched_pattern: "movie.no_year",
        }),
      );
    });

    it("handles a movie title that is itself a year (2001)", () => {
      const result = suggestRename(
        "2001.2160p.h264.mp4",
      );

      expect(result[0]).toEqual(
        expect.objectContaining({
          name: "2001.mp4",
          media_type: "movie",
          extension: "mp4",
          matched_pattern: "movie.no_year",
        }),
      );
    });

    it("handles a movie title with noise but no year", () => {
      const result = suggestRename(
        "The.Matrix.1080p.BluRay.x265.mkv",
      );

      expect(result[0]).toEqual(
        expect.objectContaining({
          name: "The Matrix.mkv",
          media_type: "movie",
          extension: "mkv",
          matched_pattern: "movie.no_year",
        }),
      );
    });

    it("handles a movie title beginning with a year-like token", () => {
      const result = suggestRename(
        "2001.A.Space.Odyssey.1968.1080p.BluRay.mkv",
      );

      expect(result[0]).toEqual(
        expect.objectContaining({
          name: "2001 A Space Odyssey (1968).mkv",
          media_type: "movie",
          extension: "mkv",
          year: "1968",
        }),
      );
    });

    it("renames a movie with an already bracketed year correctly", () => {
      const result = "The Matrix (1999).mkv"
      expect(result).toEqual(
        suggestRename("The.Matrix.(1999).1080p.BluRay.x265-PISSMASTER.mkv")[0].name
      )
    })

    it("renames a typical movie release", () => {
      const result = suggestRename(
        "The.Matrix.1999.1080p.BluRay.x265-GROUP.mkv",
      );

      expect(result).toEqual([
        expect.objectContaining({
          name: "The Matrix (1999).mkv",
          media_type: "movie",
          extension: "mkv",
          type: "video/x-matroska",
          year: "1999",
          matched_pattern: "movie.year",
        }),
      ]);
    });

    it("renames a WEB-DL movie", () => {
      const result = suggestRename(
        "Oppenheimer.2023.2160p.WEB-DL.DDP5.1.Atmos.mkv",
      );

      expect(result[0]?.name).toBe(
        "Oppenheimer (2023).mkv",
      );
    });

    it("preserves subtitle extensions", () => {
      const result = suggestRename(
        "The.Matrix.1999.1080p.BluRay.x265-GROUP.srt",
      );

      expect(result[0]).toEqual(
        expect.objectContaining({
          name: "The Matrix (1999).srt",
          media_type: "movie",
          extension: "srt",
          year: "1999",
        }),
      );
    });
  });


  describe("TV shows", () => {

    it("does not treat an unrecognized suffix as an extension for TV", () => {
      const result = suggestRename(
        "Some.Show.S03E04.1080p.WEBRip.x265",
      );

      expect(result[0]?.extension).toBeUndefined();
    });

    it("preserves a configured video extension for TV", () => {
      const result = suggestRename(
        "Some.Show.S03E04.1080p.WEBRip.x265.CCABB.mkv",
      );

      expect(result[0]).toEqual(
        expect.objectContaining({
          name: "Some Show S03E04.mkv",
          extension: "mkv",
          type: "video/x-matroska",
        }),
      );
    });

    it("recognizes an extension through MIME even when not configured", () => {
      const result = suggestRename("Some.Document.epub");

      expect(result[0]).toEqual(
        expect.objectContaining({
          extension: "epub",
          type: "application/epub+zip",
        }),
      );
    });

    it("renames a basic episode", () => {
      const result = suggestRename(
        "Some.Show.S03E04.1080p.WEBRip.x265",
      );

      expect(result[0]).toEqual(
        expect.objectContaining({
          name: "Some Show S03E04",
          media_type: "tv",
          extension: undefined,
          season: 3,
          episode: 4,
          matched_pattern: "tv.season_episode",
        }),
      );
    });

    it("extracts the episode title", () => {
      const result = suggestRename(
        "The.Trainspotting.Show.S04E13.The.One.Where.Spud.Shits.The.Bed.720p.AMZN.H265.mkv",
      );

      expect(result[0]?.name).toBe(
        "The Trainspotting Show S04E13 The One Where Spud Shits The Bed.mkv",
      );
    });

    it("pads single-digit season and episode numbers", () => {
      const result = suggestRename(
        "Some.Show.S1E2.720p.mkv",
      );

      expect(result[0]).toEqual(
        expect.objectContaining({
          name: "Some Show S01E02.mkv",
          season: 1,
          episode: 2,
        }),
      );
    });

    it("prefers TV over movie year detection", () => {
      const result = suggestRename(
        "Some.Show.2024.S02E03.1080p.mkv",
      );

      expect(result[0]).toEqual(
        expect.objectContaining({
          media_type: "tv",
          season: 2,
          episode: 3,
          name: "Some Show 2024 S02E03.mkv",
        }),
      );
    });
  });

  describe("noise removal", () => {
    it("removes video quality", () => {
      const result = suggestRename(
        "Movie.2020.1080p.mkv",
      );

      expect(result[0]?.name).toBe(
        "Movie (2020).mkv",
      );
    });

    it("removes codec information", () => {
      const result = suggestRename(
        "Movie.2020.1080p.x265.HEVC.mkv",
      );

      expect(result[0]?.name).toBe(
        "Movie (2020).mkv",
      );
    });

    it("removes streaming information", () => {
      const result = suggestRename(
        "Movie.2020.1080p.AMZN.WEB-DL.mkv",
      );

      expect(result[0]?.name).toBe(
        "Movie (2020).mkv",
      );
    });

    it("removes audio information", () => {
      const result = suggestRename(
        "Movie.2020.1080p.DDP5.1.Atmos.mkv",
      );

      expect(result[0]?.name).toBe(
        "Movie (2020).mkv",
      );
    });

    it("removes release markers", () => {
      const result = suggestRename(
        "Movie.2020.1080p.BluRay.x265-GROUP.REPACK.mkv",
      );

      expect(result[0]?.name).toBe(
        "Movie (2020).mkv",
      );
    });

    it("removes noise and everything past it", () => {
      const result = suggestRename(
        "Movie.2020.1080p.BluRay.x265-GROUP.REPACK.Any String [After Noise].mkv",
      );

      expect(result[0]?.name).toBe(
        "Movie (2020).mkv"
      );
    });
  });

  describe("MIME types", () => {
    it("detects MKV", () => {
      const result = suggestRename(
        "The.Matrix.1999.1080p.mkv",
      );

      expect(result[0]?.type).toBe(
        "video/x-matroska",
      );
    });

    it("detects MP4", () => {
      const result = suggestRename(
        "The.Matrix.1999.1080p.mp4",
      );

      expect(result[0]?.type).toBe(
        "video/mp4",
      );
    });

    it("detects SRT", () => {
      const result = suggestRename(
        "The.Matrix.1999.1080p.srt",
      );

      expect(result[0]?.type).toBe(
        "application/x-subrip",
      );
    });

    it("detects an unconfigured but known MIME type", () => {
      const result = suggestRename(
        "Some.Document.epub",
      );

      expect(result[0]).toEqual(
        expect.objectContaining({
          name: "Some Document.epub",
          media_type: "unknown",
          extension: "epub",
          type: "application/epub+zip",
        }),
      );
    });
  });

  describe("extensions", () => {
    it("preserves video extensions", () => {
      for (const extension of [
        "mp4",
        "mkv",
        "avi",
        "mov",
        "m4v",
        "wmv",
        "mpg",
        "mpeg",
        "ts",
        "m2ts",
        "mts",
        "webm",
      ]) {
        const result = suggestRename(
          `Movie.2020.1080p.${extension}`,
        );

        expect(result[0]?.extension).toBe(extension);
        expect(result[0]?.name).toMatch(
          new RegExp(`\\.${extension}$`),
        );
      }
    });

    it("preserves subtitle extensions", () => {
      for (const extension of [
        "srt",
        "ass",
        "ssa",
        "vtt",
        "sub",
        "idx",
        "smi",
        "sbv",
      ]) {
        const result = suggestRename(
          `Movie.2020.1080p.${extension}`,
        );

        expect(result[0]?.extension).toBe(extension);
        expect(result[0]?.name).toMatch(
          new RegExp(`\\.${extension}$`),
        );
      }
    });
  });

  describe("unknown files", () => {
    it("cleans up a filename without a semantic match", () => {
      const result = suggestRename(
        "Some.Document.txt",
      );

      expect(result[0]).toEqual(
        expect.objectContaining({
          name: "Some Document.txt",
          media_type: "unknown",
          extension: "txt",
          type: "text/plain",
        }),
      );
    });

  });

  describe("input", () => {
    it("returns no suggestions for empty input", () => {
      expect(suggestRename("")).toEqual([]);
    });

    it("returns no suggestions for whitespace-only input", () => {
      expect(suggestRename("   ")).toEqual([]);
    });

    it("trims surrounding whitespace", () => {
      const result = suggestRename(
        "  The.Matrix.1999.1080p.mkv  ",
      );

      expect(result[0]?.name).toBe(
        "The Matrix (1999).mkv",
      );
    });

    it("rejects non-string input", () => {
      expect(() =>
        suggestRename(123 as unknown as string),
      ).toThrow("name must be a string");
    });
  });

  describe("engine instance", () => {
    it("loads the bundled configuration", () => {
      const engine = new MediaRenameEngine();

      const result = engine.suggestRename(
        "The.Matrix.1999.1080p.mkv",
      );

      expect(result[0]?.name).toBe(
        "The Matrix (1999).mkv",
      );
    });
  });
});
