export interface ConfigMedia {
  directory: string;
  exts: string[];
}

export interface ConfigMediaSettings {
  audiobooks: ConfigMedia;
  books: ConfigMedia;
  movies: ConfigMedia;
  music: ConfigMedia;
  software: ConfigMedia;
  tvshows: ConfigMedia;
}

export interface ConfigNamingSettings {
  hosts: string[];
  models: string[];
}

export interface ConfigTransmissionSettings {
  port: number;
  host: string;
}

export interface ConfigFiltersSettings {
  words: string[];
}

export interface ConfigModel {
  downloads: string;
  media: ConfigMediaSettings;
  naming: ConfigNamingSettings;
  transmission: ConfigTransmissionSettings;
  valid_extensions: string[];
  filters: ConfigFiltersSettings;
  images: string;
}
