declare module "virtual:music-catalog" {
  type DiscoveredMusicTrack = {
    id: string;
    title: string;
    artist: string;
    src: string;
  };

  const tracks: DiscoveredMusicTrack[];
  export default tracks;
}
