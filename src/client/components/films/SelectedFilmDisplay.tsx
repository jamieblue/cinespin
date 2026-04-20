/** @jsxRuntime automatic */
/** @jsxImportSource preact */

//#region Imports
import { useState, useEffect, useRef, useCallback } from "preact/hooks";
import { Film } from "../../../shared/models/films/Film";
import { RandomFilmType } from "../../../shared/models/films/RandomFilmType";
import * as TMDBconstants from "../../../shared/constants/tmdb";
import * as IMDBconstants from "../../../shared/constants/imdb";
import { YOUTUBE_BASE_URL } from "../../../shared/constants/youtube";
import { getRatingColor } from "../../../shared/util/metacriticHelper";
import { filmService } from "../../../shared/services/filmService";
import { useSelectedFilm } from "../../contexts/SelectedFilmContext";
import { useModal } from "../../contexts/ModalContext";
import { useAuth } from "../../contexts/AuthContext";
import { ModalSize } from "../../../shared/models/modals/ModalSize";
import { AddToUserList } from "../AddToUserList";
import { route } from "preact-router";
import { GenerateFilmSlug } from "../../../shared/util/filmHelper";
import { FilmGrid } from "./FilmCarousel";
import { SelectedFilmDisplayLoadingPlaceholder } from "./SelectedFilmDisplayLoadingPlaceholder";
import { scrollToTop } from "../../../shared/util/scrollHelper";
import { useSearch } from "../../contexts/SearchContext";
import { METACRITIC_FILM_BASE_URL } from "../../../shared/constants/metacritic";
import { BackgroundTrailer } from "./BackgroundTrailer";
import { useUserSettings } from "../../../client/contexts/UserSettingsContext";
import { useWindowSize } from "../../hooks/UseWindowsize";
import { useConnectionSpeed } from "../../hooks/UseConnectionSpeed";
import { RandomFilmRatingThreshold } from "../../../shared/models/films/RandomFilmRatingThreshold";
import { FilmGridLoadingPlaceholder } from "./FilmGridLoadingPlaceHolder";
//#endregion

//#region Constants
const TMDB_IMAGE_BASE_URL = TMDBconstants.TMDB_IMAGE_BASE_URL;
const TMDB_IMAGE_SIZES = TMDBconstants.TMDB_IMAGE_SIZES;
const TMDB_FILM_BASE_URL = TMDBconstants.TMDB_FILM_BASE_URL;
const IMDB_FILM_BASE_URL = IMDBconstants.IMDB_FILM_BASE_URL;
//#endregion

type Props = {
    showRecommendationsProp?: boolean;
};

export function SelectedFilmDisplay({ showRecommendationsProp = false }: Props)
{
    //#region State
    const { user } = useAuth();
    const { showModal } = useModal();
    const { setSearchQuery } = useSearch();
    const [selectedFilm,] = useSelectedFilm();
    const [currentFilm, setCurrentFilm] = useState<Film | null>(null);
    const [showPlaceholder, setShowPlaceholder] = useState(false);
    const [showRecommendations, setShowRecommendations] = useState(showRecommendationsProp);
    const { isMobile } = useWindowSize();
    const { videosDisabled } = useUserSettings();

    //#endregion

    //#region Effects
    useEffect(() =>
    {
        const next = selectedFilm;

        if (!selectedFilm)
        {
            setCurrentFilm(null);
            return;
        }

        if (!currentFilm)
        {
            setCurrentFilm(next);
            setShowPlaceholder(false);
            return;
        }

        if (currentFilm?.tmdb_id === next.tmdb_id)
        {
            return;
        }

        setCurrentFilm(next);
        scrollToTop();
    }, [selectedFilm]);
    //#endregion

    //#region Event Handlers
    const handleRandomFilm = async (filmType: RandomFilmType) =>
    {
        setSearchQuery("");

        try
        {
            let next: Film | undefined;
            switch (filmType)
            {
                case RandomFilmType.Good:
                    {
                        const result = await filmService.getRandomFilm({ rating: 7.5, count: 500, hydration: true, randomFilmRatingThreshold: RandomFilmRatingThreshold.Higher, getYoutubeKey: !videosDisabled })
                        if (result.success) next = result.data.film;
                        break;
                    }
                case RandomFilmType.Bad:
                    {
                        const badResult = await filmService.getRandomFilm({ rating: 5, count: 500, hydration: true, randomFilmRatingThreshold: RandomFilmRatingThreshold.Lower, getYoutubeKey: !videosDisabled })
                        if (badResult.success) next = badResult.data.film;
                        break;
                    }
                case RandomFilmType.Neutral:
                    {
                        const neutralResult = await filmService.getRandomFilm();
                        if (neutralResult.success) next = neutralResult.data.film;
                        break;
                    }
                default:
                    {
                        const defaultResult = await filmService.getRandomFilm({ rating: 7.5, count: 500, hydration: true, randomFilmRatingThreshold: RandomFilmRatingThreshold.Higher, getYoutubeKey: !videosDisabled })
                        if (defaultResult.success) next = defaultResult.data.film;
                        break;
                    }
            }

            setShowRecommendations(true);

            const targetUrl = `/films/${ encodeURIComponent(GenerateFilmSlug(next.title)) }/${ encodeURIComponent(String(next.tmdb_id)) }`;
            route(targetUrl);
        }
        catch (err)
        {
            console.error("Failed to fetch random film", err);
        }
    };

    const fetchRecommendations = useCallback(async (signal?: AbortSignal): Promise<Film[]> =>
    {
        if (!currentFilm)
        {
            throw new Error('No current film to fetch recommendations for');
        }

        const result = await filmService.getRecommendations(currentFilm.tmdb_id, signal);
        if (result.success) return result.data.films;

        return [];
    }, [currentFilm?.tmdb_id]);

    const fetchFilmsByDirector = useCallback(async (signal?: AbortSignal): Promise<Film[]> =>
    {
        if (!currentFilm)
        {
            throw new Error('No current film to fetch recommendations for');
        }

        const result = await filmService.getFilmsByDirector(currentFilm.directors.map((director) => director.id), signal);
        if (result.success) return result.data.films.filter(f => f.tmdb_id !== currentFilm.tmdb_id);

        return [];
    }, [currentFilm?.tmdb_id]);

    const handleAddToListClick = () =>
    {
        showModal(<AddToUserList filmProp={currentFilm} />, "Add to List", ModalSize.Large, true);
    };
    //#endregion

    //#region Render
    return !currentFilm || !selectedFilm || showPlaceholder ?
        <>
            <SelectedFilmDisplayLoadingPlaceholder />
            <FilmGridLoadingPlaceholder title="You might also like..." />
        </>
        : (
            <section id="selectedFilmDisplaySection">
                {currentFilm.backdrop_path && (
                    <BackgroundTrailer
                        className={`background-trailer selected-film-backdrop`}
                        youtubeKey={currentFilm.youtube_key ?? undefined}
                        backdropUrl={currentFilm.backdrop_path}
                        startAt={15}
                        duration={15}
                        privacyEnhanced={false}
                    />
                )}

                <div className={`selected-film-container ${ currentFilm.backdrop_path ? "" : "no-backdrop" }`}>
                    <div className="image-container">
                        <div
                            key={`${ currentFilm.tmdb_id ?? currentFilm.id ?? currentFilm.title }`}
                            className={"flip-card spin-once"}
                        >
                            <img loading="eager" fetchpriority="high" className="front" src={`${ TMDB_IMAGE_BASE_URL }/${ isMobile ? TMDB_IMAGE_SIZES["200"] : TMDB_IMAGE_SIZES["300"] }/${ currentFilm.poster_path }`} alt={currentFilm.title} />
                            <img loading="eager" fetchpriority="high" className="back" src={`${ TMDB_IMAGE_BASE_URL }/${ isMobile ? TMDB_IMAGE_SIZES["200"] : TMDB_IMAGE_SIZES["300"] }/${ currentFilm.poster_path }`} alt={currentFilm.title} />
                        </div>
                        <div className="buttons mt-2">
                            <div>
                                <strong>Spin for a random film:</strong>
                            </div>
                            <button
                                className="spin-button"
                                type="button"
                                onClick={() => handleRandomFilm(RandomFilmType.Good)}
                            >
                                <i className="fa-solid fa-rotate green"></i><span>Good Film</span>
                            </button>
                            <button
                                className="spin-button"
                                type="button"
                                onClick={() => handleRandomFilm(RandomFilmType.Neutral)}
                            >
                                <i className="fa-solid fa-arrows-spin"></i> <span>Any Film</span>
                            </button>
                            <button
                                className="spin-button"
                                type="button"
                                onClick={() => handleRandomFilm(RandomFilmType.Bad)}
                            >
                                <i className="fa-solid fa-rotate red"></i> <span>Bad<br /> Film</span>
                            </button>

                            {user && (
                                <button
                                    type="button"
                                    className="spin-button"
                                    onClick={handleAddToListClick}
                                >
                                    <i className="fa-solid fa-plus"></i> <span>Add to List</span>
                                </button>)}
                        </div>
                    </div>
                    <div className="details">
                        <div className="details-primary">
                            <h2 className="title">
                                {currentFilm.title} <span className="runtime">{currentFilm.runtime} min</span>
                            </h2>
                            <div className="year-ratings">
                                <div className="release-year">
                                    {currentFilm.release_year}
                                </div>
                                <i class="fa-solid fa-circle"></i>
                                <div className="ratings">
                                    {(currentFilm.imdb_rating !== 0 &&
                                        currentFilm.imdb_vote_count !== "0") && (
                                            <a href={`${ IMDB_FILM_BASE_URL }/${ currentFilm.imdb_id }`} target="_blank" rel="noopener noreferrer">
                                                <div id="imdb-rating">
                                                    <div class="rating-row">
                                                        <img
                                                            src="/content/images/svg/imdb_logo.svg"
                                                            alt="IMDb:"
                                                        />
                                                        {currentFilm.imdb_rating !== 0
                                                            ? currentFilm.imdb_rating?.toFixed(1)
                                                            : "N/A"}
                                                    </div>
                                                </div>
                                            </a>
                                        )}

                                    {(currentFilm.metacritic_rating !== 0 &&
                                        currentFilm.metacritic_vote_count !== "0") && (
                                            <a href={`${ METACRITIC_FILM_BASE_URL }/${ GenerateFilmSlug(currentFilm.title) }`} target="_blank" rel="noopener noreferrer">
                                                <div id="metacritic-rating">
                                                    <div class="rating-row">
                                                        <img
                                                            src="/content/images/png/metacritic.png"
                                                            alt="Metacritic:"
                                                        />
                                                        <div
                                                            id="metacritic-rating-value"
                                                            className={`metacritic-rating-${ getRatingColor(currentFilm.metacritic_rating || 0) }`}
                                                        >
                                                            {currentFilm.metacritic_rating}
                                                        </div>
                                                    </div>
                                                </div>
                                            </a>
                                        )}

                                    {(currentFilm.tmdb_rating !== 0 &&
                                        currentFilm.tmdb_vote_count !== "0") && (
                                            <a href={`${ TMDB_FILM_BASE_URL }/${ currentFilm.tmdb_id }`} target="_blank" rel="noopener noreferrer">
                                                <div id="tmdb-rating">
                                                    <div class="rating-row">
                                                        <img
                                                            src="/content/images/svg/tmdb_logo.svg"
                                                            alt="TMDB:"
                                                        />
                                                        {currentFilm.tmdb_rating.toFixed(1)}
                                                    </div>
                                                </div>
                                            </a>
                                        )}
                                </div>
                            </div>
                            {currentFilm.youtube_key && (
                                <div className="trailer">
                                    <a href={`${ YOUTUBE_BASE_URL + currentFilm.youtube_key }`} target="_blank" rel="noopener noreferrer">
                                        Watch Trailer
                                    </a>
                                </div>
                            )}
                            <div className="credits">
                                <ul>
                                    <li><strong>Director(s): </strong>{currentFilm.directors.map((director) => director.name)?.join(", ")}</li>
                                    <li><strong>Top Cast: </strong>{currentFilm.cast?.map((member) => member.name).join(", ")}</li>
                                </ul>
                            </div>
                            {currentFilm.genres.length > 0 && (
                                <div class="genres">
                                    {currentFilm.genres && currentFilm.genres.length > 0 && (
                                        currentFilm.genres.map((el) => (
                                            <div class="genre" key={el.id}>{el.name}</div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="details-secondary">
                            {/* Mobile-only: show the spin buttons here on small screens */}
                            <div className="buttons buttons-mobile">
                                <button
                                    type="button"
                                    onClick={() => handleRandomFilm(RandomFilmType.Good)}
                                >
                                    <i className="fa-solid fa-rotate green"></i><span>Good Film</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleRandomFilm(RandomFilmType.Neutral)}
                                >
                                    <i className="fa-solid fa-arrows-spin"></i> <span>Any Film</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleRandomFilm(RandomFilmType.Bad)}
                                >
                                    <i className="fa-solid fa-rotate red"></i> <span>Bad Film</span>
                                </button>

                                {user && (
                                    <button
                                        type="button"
                                        onClick={handleAddToListClick}
                                    >
                                        <i className="fa-solid fa-plus"></i> <span>Add to List</span>
                                    </button>
                                )}
                            </div>

                            {currentFilm.tagline && (
                                <div className="tagline">
                                    {currentFilm.tagline}
                                </div>
                            )}
                            <div className="overview">
                                {currentFilm.overview}
                            </div>

                            {currentFilm.genres.length > 0 && (
                                <div className="genres">
                                    {currentFilm.genres.map((el) => (
                                        <div class="genre" key={el.id}>{el.name}</div>
                                    ))}
                                </div>
                            )}

                            {currentFilm.watch_providers && currentFilm.watch_providers.length > 0 ? (
                                <>
                                    <div className="providers-title"><strong>Available to stream on:</strong></div>
                                    <div className="providers">
                                        {currentFilm.watch_providers.map((provider) =>
                                        {

                                            const name = (provider.provider_name || "").toLowerCase();
                                            if (name.includes("netflix"))
                                            {
                                                return <img className="provider" key={provider.provider_name} src="/content/images/png/netflix.png" alt={provider.provider_name} decoding="async" />;
                                            }
                                            if (name.includes("disney"))
                                            {
                                                return <img className="provider" key={provider.provider_name} src="/content/images/png/disneyplus.png" alt={provider.provider_name} decoding="async" />;
                                            }
                                            if (name.includes("amazon"))
                                            {
                                                return <img className="provider amazon-prime" key={provider.provider_name} src="/content/images/svg/prime-logo.svg" alt={provider.provider_name} decoding="async" />;
                                            }
                                            if (provider.logo_path)
                                            {
                                                return <img loading="lazy" className="provider" key={provider.provider_name} src={`${ TMDB_IMAGE_BASE_URL }/original/${ provider.logo_path }`} alt={provider.provider_name} decoding="async" />;
                                            }
                                            return null;
                                        })}
                                    </div>
                                </>
                            ) : (
                                <></>
                            )}
                        </div>
                    </div>
                </div >
                <div className="container" id="films">
                    {showRecommendations && currentFilm && (
                        <FilmGrid
                            title="You might also like..."
                            fetchFilms={fetchRecommendations}
                        />
                    )}

                    {showRecommendations && currentFilm && (
                        <FilmGrid
                            title={`More films by ${ currentFilm.directors.map((d) => d.name).join(", ") }`}
                            fetchFilms={fetchFilmsByDirector}
                        />
                    )}
                </div>
            </section>
        );
    //#endregion
}

