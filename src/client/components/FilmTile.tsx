/** @jsxRuntime automatic */
/** @jsxImportSource preact */
import { useState, useEffect } from "preact/hooks";
import { Film } from "../../shared/models/Film";
import * as constants from "../../shared/constants/tmdb";
import { getRatingColor } from "../../shared/util/metacriticHelper";

const TMDB_IMAGE_BASE_URL = constants.TMDB_IMAGE_BASE_URL;
const TMDB_IMAGE_SIZES = constants.TMDB_IMAGE_SIZES;

type Props = {
    film: Film;
    onClick?: () => void;
};

export function FilmTile({ film, onClick }: Props)
{
    const [loading, setLoading] = useState(true);
    const [showPlaceholder, setShowPlaceholder] = useState(false);

    useEffect(() =>
    {
        let didLoad = false;
        const img = new Image();
        img.src = `${ TMDB_IMAGE_BASE_URL }/${ TMDB_IMAGE_SIZES["200"] }${ film.poster_path }`;

        const placeholderDelay = setTimeout(() =>
        {
            if (!didLoad)
            {
                setShowPlaceholder(true);
            }
        }, 100);

        img.onload = () =>
        {
            didLoad = true;
            clearTimeout(placeholderDelay);
            setLoading(false);
            setShowPlaceholder(false);
        };

        return () =>
        {
            clearTimeout(placeholderDelay);
        };
    }, [film.poster_path]);

    return (
        <div class="film-tile" onClick={onClick}>
            <div className="title">
                {film.title} ({film.release_date})
            </div>
            <div class="image-wrapper">
                <img
                    src={`${ TMDB_IMAGE_BASE_URL }/${ TMDB_IMAGE_SIZES["200"] }${ film.poster_path }`}
                    alt={film.title}
                    class={`film-tile-img ${ loading ? "" : "loaded" }`}
                />
                {showPlaceholder && (
                    <div className="loading-placeholder pulsate">
                    </div>
                )}
            </div>
            {film.vote_average !== 0 || film.imdb_rating !== 0 ? (
                <div className="film-tile-ratings">
                    <div className="film-tile-rating">
                        {film.imdb_rating != 0 ? (
                            <>
                                <img
                                    src="/content/images/svg/imdb_logo.svg"
                                    alt="IMDb:"
                                />
                                <div className="film-tile-rating-value">
                                    {film.imdb_rating?.toFixed(1)}
                                </div>
                            </>
                        ) : (
                            <>

                            </>
                        )}
                    </div>

                    {film.metacritic_rating != 0 ? (
                        <div className="film-tile-rating">
                            <img
                                src="/content/images/png/metacritic.png"
                                alt="Metacritic:"
                            />
                            <div className={`film-tile-rating-value metacritic-rating-${ getRatingColor(film.metacritic_rating || 0) }`}>
                                {film.metacritic_rating}
                            </div>
                        </div>
                    ) : (
                        <div className="film-tile-rating">
                            {film.vote_average != 0 ? (
                                <>
                                    <img
                                        src="/content/images/svg/tmdb_logo.svg"
                                        alt="TMDB:"
                                    />
                                    <div className="film-tile-rating-value">
                                        {film.vote_average?.toFixed(1)}
                                    </div>
                                </>
                            ) : (
                                <>

                                </>
                            )}
                        </div>
                    )}
                </div>
            ) : <></>}
        </div>
    );
}