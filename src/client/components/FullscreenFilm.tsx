/** @jsxRuntime automatic */
/** @jsxImportSource preact */
import { useState, useEffect } from "preact/hooks";
import { Film } from "../../shared/models/films/Film";
import { RandomFilmType } from "../../shared/models/films/RandomFilmType";
import * as TMDBconstants from "../../shared/constants/tmdb";
import * as IMDBconstants from "../../shared/constants/imdb";
import { scrollLock } from "../../shared/util/scrollLock";
import { getRatingColor } from "../../shared/util/metacriticHelper";
import { filmService } from "../../shared/services/filmService";
import { useSelectedFilm } from "../contexts/SelectedFilmContext";
import { useModal } from "../contexts/ModalContext";
import { useAuth } from "../contexts/AuthContext";
import { ModalSize } from "../../shared/models/modals/ModalSize";
import { AddToUserList } from "./AddToUserList";

const TMDB_IMAGE_BASE_URL = TMDBconstants.TMDB_IMAGE_BASE_URL;
const TMDB_IMAGE_SIZES = TMDBconstants.TMDB_IMAGE_SIZES;
const TMDB_FILM_BASE_URL = TMDBconstants.TMDB_FILM_BASE_URL;
const IMDB_FILM_BASE_URL = IMDBconstants.IMDB_FILM_BASE_URL;

type Props = {
    film: Film;
    onClose: () => void;
};

export function FullscreenFilm({ film, onClose }: Props)
{
    const { user } = useAuth();
    const { isVisible: modalVisible, showModal } = useModal();
    const [isClosing, setIsClosing] = useState(false);
    const [selectedFilm] = useSelectedFilm();
    const [currentFilm, setCurrentFilm] = useState(film);
    const [queuedFilm, setQueuedFilm] = useState<Film | null>(null);

    useEffect(() =>
    {
        setCurrentFilm(selectedFilm || film);
        scrollLock.enable();

        return () =>
        {
            modalVisible ? scrollLock.enable() : scrollLock.disable();
        };
    }, [selectedFilm, modalVisible]);

    // Preload the image to avoid flickering
    const preloadImage = (src: string): Promise<void> =>
        new Promise((resolve) =>
        {
            const img = new Image();
            img.src = src;
            img.onload = () => resolve();
        });

    const handleRandomFilm = async (filmType: RandomFilmType) =>
    {
        let next: Film;
        switch (filmType)
        {
            case RandomFilmType.Good:
                const result = await filmService.getRandomGoodFilm();
                if (result.success)
                {
                    next = result.data.film;
                }
                break;
            case RandomFilmType.Bad:
                const badResult = await filmService.getRandomBadFilm();
                if (badResult.success)
                {
                    next = badResult.data.film;
                }
                break;
            case RandomFilmType.Neutral:
                const neutralResult = await filmService.getRandomFilm();
                if (neutralResult.success)
                {
                    next = neutralResult.data.film;
                }
                break;
            default:
                const defaultResult = await filmService.getRandomGoodFilm();
                if (defaultResult.success)
                {
                    next = defaultResult.data.film;
                }
                break;
        }

        await preloadImage(
            `${ TMDB_IMAGE_BASE_URL }/${ TMDB_IMAGE_SIZES["500"] }${ next.poster_path }`
        );
        setQueuedFilm(next);
        setIsClosing(true);
    };

    const handleAddToListClick = () =>
    {
        showModal(<AddToUserList filmProp={currentFilm} />, "Add to List", ModalSize.Large, true);
    };

    const handleClose = () =>
    {
        setIsClosing(true);
    };

    const onAnimationEnd = () =>
    {
        if (isClosing)
        {
            if (queuedFilm)
            {
                setCurrentFilm(queuedFilm);
                setQueuedFilm(null);
                setIsClosing(false);
            } else
            {
                onClose();
            }
        }
    };

    return (
        <div
            class={`fullscreen-film ${ isClosing ? "fade-out" : "fade-in" }`}
            onAnimationEnd={onAnimationEnd}
        >
            <div class="close-button" onClick={handleClose}>
                <i class="fa-solid fa-xmark"></i>
            </div>

            <img
                src={`${ TMDB_IMAGE_BASE_URL }/${ TMDB_IMAGE_SIZES["500"] }${ currentFilm.poster_path }`}
                alt={currentFilm.title}
            />

            <div class="details">
                <h2 class="title">{currentFilm.title}</h2>
                <div class="release-year">
                    {currentFilm.release_year}
                </div>
                <div class="overview">{currentFilm.overview}</div>
                {currentFilm.genres.length > 0 && (
                    <div class="genres">
                        {currentFilm.genres && currentFilm.genres.length > 0 && (
                            currentFilm.genres.map((el) => (
                                <div class="genre" key={el.id}>{el.name}</div>
                            ))
                        )}
                    </div>
                )}

                <div id="ratings">
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
                                    <div class="vote-count">
                                        {currentFilm.imdb_rating !== 0
                                            ? `${ currentFilm.imdb_vote_count } votes`
                                            : ""}
                                    </div>
                                </div>
                            </a>
                        )}

                    {(currentFilm.metacritic_rating !== 0 &&
                        currentFilm.metacritic_vote_count !== "0") && (
                            <a href={currentFilm.metacritic_url} target="_blank" rel="noopener noreferrer">
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
                                    <div class="vote-count">
                                        {currentFilm.metacritic_vote_count} critics
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
                                    <div class="vote-count">
                                        {currentFilm.tmdb_vote_count} votes
                                    </div>
                                </div>
                            </a>
                        )}
                </div>

                <div class="buttons">
                    <button
                        type="button"
                        onClick={() => handleRandomFilm(RandomFilmType.Good)}
                    >
                        <i class="fa-solid fa-thumbs-up"></i> Random Good Film
                    </button>
                    <button
                        type="button"
                        onClick={() => handleRandomFilm(RandomFilmType.Neutral)}
                    >
                        <i class="fa-solid fa-rotate"></i> Random Film
                    </button>
                    <button
                        type="button"
                        onClick={() => handleRandomFilm(RandomFilmType.Bad)}
                    >
                        <i class="fa-solid fa-thumbs-down"></i> Random Bad Film
                    </button>

                    {user && (
                        <button
                            type="button"
                            onClick={handleAddToListClick}
                        >
                            <i class="fa-solid fa-plus"></i> Add Film to a List
                        </button>)}
                </div>
            </div>
        </div>
    );
}

