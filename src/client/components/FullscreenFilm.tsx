/** @jsxRuntime automatic */
/** @jsxImportSource preact */
import { useState, useEffect } from "preact/hooks";
import { Film } from "../../shared/models/films/Film";
import { RandomFilmType } from "../../shared/models/films/RandomFilmType";
import axios from "axios";
import * as TMDBconstants from "../../shared/constants/tmdb";
import * as IMDBconstants from "../../shared/constants/imdb";
import { scrollLock } from "../../shared/util/scrollLock";
import { getRatingColor } from "../../shared/util/metacriticHelper";

const TMDB_IMAGE_BASE_URL = TMDBconstants.TMDB_IMAGE_BASE_URL;
const TMDB_IMAGE_SIZES = TMDBconstants.TMDB_IMAGE_SIZES;
const TMDB_FILM_BASE_URL = TMDBconstants.TMDB_FILM_BASE_URL;
const IMDB_FILM_BASE_URL = IMDBconstants.IMDB_FILM_BASE_URL;

type Props = {
    film: Film;
    onClose: () => void;
};

async function getRandomFilm(): Promise<Film>
{
    const response = await axios.get(
        "http://localhost:3001/api/tmdb/random-film"
    );
    return response.data as Film;
}

async function getRandomGoodFilm(): Promise<Film>
{
    const response = await axios.get(
        "http://localhost:3001/api/tmdb/random-good-film"
    );
    return response.data as Film;
}

async function getRandomBadFilm(): Promise<Film>
{
    const response = await axios.get(
        "http://localhost:3001/api/tmdb/random-bad-film"
    );
    return response.data as Film;
}

export function FullscreenFilm({ film, onClose }: Props)
{
    const [isClosing, setIsClosing] = useState(false);
    const [currentFilm, setCurrentFilm] = useState(film);
    const [queuedFilm, setQueuedFilm] = useState<Film | null>(null);

    useEffect(() =>
    {
        scrollLock.enable();
        return () => scrollLock.disable();
    }, []);

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
                next = await getRandomGoodFilm();
                break;
            case RandomFilmType.Bad:
                next = await getRandomBadFilm();
                break;
            case RandomFilmType.Neutral:
            default:
                next = await getRandomFilm(); // Default to good film
                break;
        }

        await preloadImage(
            `${ TMDB_IMAGE_BASE_URL }/${ TMDB_IMAGE_SIZES["500"] }${ next.poster_path }`
        );
        setQueuedFilm(next);
        setIsClosing(true); // trigger fade-out of current
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
                setIsClosing(false); // trigger fade-in
            } else
            {
                onClose();
            }
        }
    };

    return (
        <div
            class={`fullscreen-film ${ isClosing ? "slide-out" : "slide-in" }`}
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
                    {currentFilm.release_date.toString().substring(0, 4)}
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

                    {(currentFilm.vote_average !== 0 &&
                        currentFilm.vote_count !== "0") && (
                            <a href={`${ TMDB_FILM_BASE_URL }/${ currentFilm.tmdb_id }`} target="_blank" rel="noopener noreferrer">
                                <div id="tmdb-rating">
                                    <div class="rating-row">
                                        <img
                                            src="/content/images/svg/tmdb_logo.svg"
                                            alt="TMDB:"
                                        />
                                        {currentFilm.vote_average.toFixed(1)}
                                    </div>
                                    <div class="vote-count">
                                        {currentFilm.vote_count} votes
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
                </div>
            </div>
        </div>
    );
}

