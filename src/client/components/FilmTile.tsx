/** @jsxRuntime automatic */
/** @jsxImportSource preact */
import { useState, useEffect } from "preact/hooks";
import { Film } from "../../shared/models/films/Film";
import * as constants from "../../shared/constants/tmdb";
import { getRatingColor } from "../../shared/util/metacriticHelper";
import { useAuth } from "../contexts/AuthContext";
import { useModal } from "../contexts/ModalContext";
import { ModalSize } from "../../shared/models/modals/ModalSize";
import { useSelectedFilm } from "../../client/contexts/SelectedFilmContext";
import { FilmList } from "../../shared/models/lists/FilmList";
import { AddToUserList } from "./AddToUserList";

const TMDB_IMAGE_BASE_URL = constants.TMDB_IMAGE_BASE_URL;
const TMDB_IMAGE_SIZES = constants.TMDB_IMAGE_SIZES;

type Props = {
    film: Film;
    small?: boolean;
    currentList?: FilmList;
    showOptions?: boolean;
    onRemoveFilm?: (film: Film, list: FilmList) => void;
};

export function FilmTile({ film, small, currentList, onRemoveFilm, showOptions = true }: Props)
{
    const { showModal } = useModal();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [showPlaceholder, setShowPlaceholder] = useState(false);
    const [isSmall, setIsSmall] = useState(false);
    const [, setSelectedFilm] = useSelectedFilm();

    useEffect(() =>
    {
        setIsSmall(small);
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

    const handleAddToListClick = (e: Event) =>
    {
        e.stopPropagation();

        if (!user)
        {
            console.log('Please log in to add to list');
            return;
        }

        showModal(<AddToUserList filmProp={film} />, "Add to List", ModalSize.Large);
    };

    return (
        <div class="film-tile" onClick={() => setSelectedFilm(film)}>
            <div className="title">
                {film.title} ({film.release_year})
            </div>
            <div class="image-wrapper">
                <img
                    src={`${ TMDB_IMAGE_BASE_URL }/${ TMDB_IMAGE_SIZES["200"] }${ film.poster_path }`}
                    alt={film.title}
                    class={`film-tile-img ${ loading ? "" : "loaded" }`}
                />
                {showPlaceholder && (
                    <div className="loading-placeholder pulsate">
                        <span className="loader"></span>
                    </div>
                )}
            </div>
            {film.tmdb_rating !== 0 || film.imdb_rating !== 0 || film.metacritic_rating !== 0 ? (
                <div className="film-tile-ratings">
                    {film.imdb_rating != 0 ? (
                        <>
                            <div className="film-tile-rating">
                                <img
                                    src="/content/images/svg/imdb_logo.svg"
                                    alt="IMDb:"
                                />
                                <div className="film-tile-rating-value">
                                    {film.imdb_rating?.toFixed(1)}
                                </div>
                            </div>
                        </>
                    ) : (
                        <>

                        </>
                    )}

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
                    ) : film.tmdb_rating != 0 ? (
                        <div className="film-tile-rating">
                            <img
                                src="/content/images/svg/tmdb_logo.svg"
                                alt="TMDB:"
                            />
                            <div className="film-tile-rating-value">
                                {film.tmdb_rating?.toFixed(1)}
                            </div>
                        </div>
                    ) : null}
                </div>
            ) : <></>
            }
            {showOptions && user && (
                <>
                    {!currentList && (
                        <button className="film-tile-action" onClick={handleAddToListClick}>
                            <i className="fas fa-plus"></i>
                        </button>
                    )}
                    {currentList && onRemoveFilm && (
                        <div
                            className="film-tile-action"
                            onClick={(e: MouseEvent) =>
                            {
                                e.stopPropagation();
                                onRemoveFilm(film, currentList);
                            }}
                        >
                            <i className="fas fa-trash"></i>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}