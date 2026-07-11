import discoveredTracks from "virtual:music-catalog";

export type MusicTrack = {
  id: string;
  title: string;
  artist: string;
  src: string;
};

export const musicCatalog: MusicTrack[] = discoveredTracks;

export const musicTrackById = new Map(musicCatalog.map((track) => [track.id, track]));
