import { Heart, Music2, Play } from "lucide-react";
import { useLanguage } from "../../i18n";
import { useMusic } from "./MusicProvider";

export function MusicFavoritesCard() {
  const { t } = useLanguage();
  const { currentTrack, favoriteTracks, isPlaying, playTrack, toggleFavorite } = useMusic();

  return (
    <section className="profile-card music-profile-card">
      <div className="profile-card__heading">
        <Heart size={19} aria-hidden="true" />
        <h2>{t("music.profileFavorites")}</h2>
      </div>
      {favoriteTracks.length ? (
        <div className="music-profile-list">
          {favoriteTracks.map((track) => {
            const isCurrent = currentTrack?.id === track.id && isPlaying;
            return (
              <div className="music-profile-track" key={track.id}>
                <button aria-label={t("music.playTrack", { title: track.title })} onClick={() => playTrack(track.id)} type="button">
                  {isCurrent ? <Music2 size={17} /> : <Play fill="currentColor" size={16} />}
                </button>
                <span><strong>{track.title}</strong><small>{track.artist}</small></span>
                <button aria-label={t("music.removeFavorite")} className="music-profile-track__heart" onClick={() => toggleFavorite(track.id)} type="button">
                  <Heart fill="currentColor" size={17} />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="music-profile-empty">{t("music.profileFavoritesEmpty")}</p>
      )}
    </section>
  );
}
