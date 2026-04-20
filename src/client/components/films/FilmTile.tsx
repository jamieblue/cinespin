/** @jsxRuntime automatic */
/** @jsxImportSource preact */
import { useState, useEffect, useRef } from "preact/hooks";
import { memo } from "preact/compat";
import { Film } from "../../../shared/models/films/Film";
import * as constants from "../../../shared/constants/tmdb";
import { getRatingColor } from "../../../shared/util/metacriticHelper";
import { useAuth } from "../../contexts/AuthContext";
import { FilmList } from "../../../shared/models/lists/FilmList";
import { GenerateFilmSlug } from "../../../shared/util/filmHelper";
import { useLongPress } from "../../hooks/UseLongPress";
import { useConnectionSpeed } from "../../hooks/UseConnectionSpeed";
import { useFilmBottomSheet } from "../../contexts/FilmBottomSheetContext";
import { TileBackgroundTrailer } from "./TileBackgroundTrailer";
import { useWindowSize } from "../../hooks/UseWindowsize";
import { useUserSettings } from "../../contexts/UserSettingsContext";
import { DropdownMenu } from "../UI/DropdownMenu";
import { listService } from "../../../shared/services/listService";

const TMDB_IMAGE_BASE_URL = constants.TMDB_IMAGE_BASE_URL;
const TMDB_IMAGE_SIZES = constants.TMDB_IMAGE_SIZES;

type Props = {
    film: Film;
    small?: boolean;
    currentList?: FilmList;
    onRemoveFilm?: (film: Film, list: FilmList) => void;
};

export const FilmTile = memo(function ({ film, currentList, onRemoveFilm }: Props)
{
    const { user } = useAuth();
    const [hover, setHover] = useState(false);
    const [canHover, setCanHover] = useState(false);
    const tileRef = useRef<HTMLDivElement | null>(null);
    const { openFilmSheet } = useFilmBottomSheet();
    const [backdropLoaded, setBackdropLoaded] = useState(false);
    const [posterLoaded, setPosterLoaded] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const { isMobile } = useWindowSize();
    const { videosDisabled } = useUserSettings();
    const [isLiked, setIsLiked] = useState(film.liked || false);
    const [isDisliked, setIsDisliked] = useState(film.disliked || false);

    const isSlow = useConnectionSpeed();

    const { handlers } = useLongPress(() =>
    {
        if (user)
        {
            openFilmSheet(film);
        }
    });

    useEffect(() =>
    {
        console.log(isLiked, film.liked);
        if (typeof window === 'undefined') return;
        const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
        const apply = () =>
        {
            setCanHover(mq.matches);
            if (!mq.matches) setHover(false); // ensure off on touch
        };
        apply();
        mq.addEventListener('change', apply);
        return () => mq.removeEventListener('change', apply);
    }, []);

    useEffect(() =>
    {
        if (!tileRef.current) return;
        const el = tileRef.current;
        const io = new IntersectionObserver(entries =>
        {
            if (entries[0].isIntersecting)
            {
                io.disconnect();
            }
        }, { rootMargin: "200px" });
        io.observe(el);
        return () => io.disconnect();
    }, []);

    const handleAddToListButtonClick = (e: Event) =>
    {
        e.stopPropagation();

        if (!user)
        {
            console.log('Please log in to add to list');
            return;
        }

        setShowDropdown(true);
    };

    const handleAddToListClick = async (list: FilmList) =>
    {
        if (!user) return;

        if (film)
        {
            const result = await listService.addFilmToList({ listId: list.id, film: film });
            if (result.success)
            {
                console.log(`Added film to list: ${ list.name }`);
            }
            else if (result.success === false)
            {
                console.error(`Failed to add film to list: ${ list.name }`, result.error);
            }
        }
    };

    const handleLikeFilmClick = async (film: Film) =>
    {
        if (!user) return;

        const newLikedState = !isLiked;
        setIsLiked(newLikedState);
        film.liked = newLikedState;
        
        if (newLikedState && isDisliked) {
            setIsDisliked(false);
            film.disliked = false;
        }

        if (film)
        {
            const result = await listService.addFilmToList({ listName: 'Liked', film: film, userId: user.id });
            if (result.success)
            {
                console.log(`Toggled film liked status successfully`);
            }
            else if (result.success === false)
            {
                console.error(`Failed to toggle film liked status`, result.error);
                setIsLiked(!newLikedState);
                film.liked = !newLikedState;
            }
        }
    };

    const handleDislikeFilmClick = async (film: Film) =>
    {
        if (!user) return;

        const newDislikedState = !isDisliked;
        setIsDisliked(newDislikedState);
        film.disliked = newDislikedState;
        
        if (newDislikedState && isLiked) {
            setIsLiked(false);
            film.liked = false;
        }

        if (film)
        {
            const result = await listService.addFilmToList({ listName: 'Disliked', film: film, userId: user.id });
            if (result.success)
            {
                console.log(`Toggled film disliked status successfully`);
            }
            else if (result.success === false)
            {
                console.error(`Failed to toggle film disliked status`, result.error);
                setIsDisliked(!newDislikedState);
                film.disliked = !newDislikedState;
            }
        }
    };

    return (
        <>
            {user && user.lists && user.lists.length > 0 && (
                <DropdownMenu
                    show={showDropdown}
                    onItemClick={async (list) =>
                    {
                        await handleAddToListClick(list);
                    }}
                    onClose={() => setShowDropdown(false)}
                    items={user.lists.map(list => ({ ...list, displayName: list.name }))}
                />
            )}
            <div
                ref={tileRef}
                class="film-tile"
                {...handlers}
                tabIndex={0}
                onPointerEnter={canHover ? (() => setHover(true)) : undefined}
                onPointerLeave={canHover ? (() => setHover(false)) : undefined}
                onFocus={canHover ? (() => setHover(true)) : undefined}
                onBlur={canHover ? (() => setHover(false)) : undefined}
            >
                <a
                    class="film-tile-link"
                    href={`/films/${ encodeURIComponent(GenerateFilmSlug(film.title)) }/${ encodeURIComponent(String(film.tmdb_id)) }`}
                    onClick={(e: MouseEvent) =>
                    {
                        if (!canHover && hover) setHover(false);
                    }}
                >
                    <div class="image-wrapper">
                        <span className="tile-overlay" />

                        {film.youtube_key && !isSlow && canHover && hover && !isMobile && (
                            <TileBackgroundTrailer
                                youtubeKey={film.youtube_key}
                                startAt={15}
                                duration={40}
                                play={hover && canHover}
                                preload={true}
                                privacyEnhanced={false}
                                className="tile-background-trailer"
                                disabled={videosDisabled}
                            />
                        )}

                        {!posterLoaded && isMobile && (
                            <div className="loading-placeholder-filler">

                            </div>
                        )}

                        {film.poster_path && !film.backdrop_path && !isMobile && (
                            <img
                                src={`${ TMDB_IMAGE_BASE_URL }/${ TMDB_IMAGE_SIZES["500"] }${ film.poster_path }`}
                                alt={film.title}
                                loading="lazy"
                                onLoad={() => setPosterLoaded(true)}
                                className={`film-tile-img poster ${ film.backdrop_path ? "" : "no-backdrop" }`}
                            />
                        )}

                        {film.poster_path && isMobile && (
                            <img
                                src={`${ TMDB_IMAGE_BASE_URL }/${ film.backdrop_path ? TMDB_IMAGE_SIZES["154"] : TMDB_IMAGE_SIZES["500"] }${ film.poster_path }`}
                                alt={film.title}
                                loading="lazy"
                                onLoad={() => setPosterLoaded(true)}
                                className={`film-tile-img poster ${ film.backdrop_path ? "" : "no-backdrop" }`}
                            />
                        )}

                        {film.backdrop_path && !isMobile && !backdropLoaded && (
                            <div className="loading-placeholder-filler">

                            </div>
                        )}

                        {film.backdrop_path && !isMobile && (
                            <img
                                src={`${ TMDB_IMAGE_BASE_URL }/w780${ film.backdrop_path }`}
                                alt={film.title}
                                loading="lazy"
                                onLoad={() => setBackdropLoaded(true)}
                                className={`film-tile-img backdrop ${ backdropLoaded ? "active" : "" }`}
                            />
                        )}

                        <div class="tile-details">

                            <div className="title">
                                {film.title}
                            </div>

                            <div className="year-ratings">
                                <div className="release-year">
                                    {film.release_year}
                                </div>

                                {film.tmdb_rating !== 0 || film.imdb_rating !== 0 || film.metacritic_rating !== 0 ? (
                                    <>
                                        <i class="fa-solid fa-circle"></i>
                                        <div className="film-tile-ratings">
                                            {film.imdb_rating != 0 ? (
                                                <>
                                                    <div id="imdbRating" className="film-tile-rating fade-in">
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
                                                    {film.imdb_id && (
                                                        <div className="film-tile-rating">
                                                            <span class="loader"></span>
                                                        </div>
                                                    )}
                                                </>
                                            )}

                                            {film.metacritic_rating != 0 && (
                                                <div className="film-tile-rating fade-in">
                                                    <img
                                                        src="/content/images/png/metacritic.png"
                                                        alt="Metacritic:"
                                                    />
                                                    <div className={`film-tile-rating-value metacritic-rating-${ getRatingColor(film.metacritic_rating || 0) }`}>
                                                        {film.metacritic_rating}
                                                    </div>
                                                </div>
                                            )}
                                            {film.tmdb_rating != 0 && (
                                                <div className="film-tile-rating">
                                                    <img
                                                        src="/content/images/svg/tmdb_logo.svg"
                                                        alt="TMDB:"
                                                    />
                                                    <div className="film-tile-rating-value">
                                                        {film.tmdb_rating?.toFixed(1)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : <></>
                                }
                            </div>
                        </div>
                    </div>
                </a>
                {user && (
                    <div className="film-tile-actions">
                        {!currentList && (
                            <>
                                <button className="film-tile-action" onClick={handleAddToListButtonClick}>
                                    <i className="fas fa-plus"></i>
                                </button>
                            </>
                        )}
                        <button onClick={() => handleLikeFilmClick(film)} className={`film-tile-action`}>
                                {isLiked ? (
                                    <i className="fa-solid fa-thumbs-up green"></i>
                                ) : (
                                    <i className="fa-regular fa-thumbs-up green"></i>
                                )}
                        </button>
                        <button onClick={() => handleDislikeFilmClick(film)} className="film-tile-action">
                            {isDisliked ? (
                                <i className="fa-solid fa-thumbs-down red"></i>
                            ) : (
                                <i className="fa-regular fa-thumbs-down red"></i>
                            )}
                        </button>
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
                    </div>
                )}
            </div>
        </>
    );
});