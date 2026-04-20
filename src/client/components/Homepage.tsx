/** @jsxRuntime automatic */
/** @jsxImportSource preact */
import { useMemo, useEffect, useState } from "preact/hooks";
import { FilmGrid } from "./films/FilmCarousel";
import { filmService } from "../../shared/services/filmService";
import { Film } from "../../shared/models/films/Film";
import { useSearch } from "../contexts/SearchContext";
import { BackgroundTrailer } from "./films/BackgroundTrailer";
import { GenerateFilmSlug } from "../../shared/util/filmHelper";
import { RandomFilmType } from "../../shared/models/films/RandomFilmType";
import { route } from "preact-router";
import { scrollToTop } from "../../shared/util/scrollHelper";
import { useUserSettings } from "../../client/contexts/UserSettingsContext";
import { RandomFilmRatingThreshold } from "../../shared/models/films/RandomFilmRatingThreshold";
import { useConnectionSpeed } from "../../client/hooks/UseConnectionSpeed";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export function Homepage()
{
    const { searchQuery } = useSearch();
    const [, setSelectedFilm] = useState<Film | null>(null);
    const { videosDisabled } = useUserSettings();
    const isSlow = useConnectionSpeed();

    const queryClient = useQueryClient();
    const cachedFilmList = queryClient.getQueryData<Film[]>(["backdrop-film-list"]);

    // Fetch a single random film ONLY if there is no cached film list
    const { data: fallbackFilm } = useQuery({
        queryKey: ["backdrop-film-fallback"],
        queryFn: async () =>
        {
            const result = await filmService.getRandomFilm({
                rating: 7.7,
                count: 5000,
                hydration: false,
                randomFilmRatingThreshold: RandomFilmRatingThreshold.Higher,
                getYoutubeKey: !videosDisabled
            });
            if (result.success) return result.data.film;
            else if (result.success === false)
            {
                console.error("Failed to fetch random film for backdrop", result.error);
            }
        },
        enabled: !cachedFilmList, // Only run if no cached list
        staleTime: 1000 * 60 * 10,
    });

    // Prefetch the film list in the background after first paint
    useEffect(() =>
    {
        if (!cachedFilmList)
        {
            queryClient.prefetchQuery({
                queryKey: ["backdrop-film-list"],
                queryFn: async () =>
                {
                    const result = await filmService.getBestFilms();

                    if (result.success && Array.isArray(result.data.films))
                    {
                        return result.data.films;
                    }
                    else if (result.success === false)
                    {
                        console.error("Failed to fetch best films for backdrop", result.error);
                    }
                },
                staleTime: 1000 * 60 * 60 * 24, // 1 day
            });
        }
    }, [queryClient, cachedFilmList]);

    // Use the cached list if available, otherwise fallback to the single film
    const currentFilm = useMemo(() =>
    {
        if (cachedFilmList && cachedFilmList.length > 0)
        {
            const idx = Math.floor(Math.random() * cachedFilmList.length);
            return cachedFilmList[idx];
        }

        return fallbackFilm ?? null;
    }, [cachedFilmList, fallbackFilm]);

    const handleRandomFilm = async (filmType: RandomFilmType) =>
    {
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

            const targetUrl = `/films/${ encodeURIComponent(GenerateFilmSlug(next.title)) }/${ encodeURIComponent(String(next.tmdb_id)) }`;
            route(targetUrl);

            scrollToTop();
        }
        catch (err)
        {
            console.error("Failed to fetch random film", err);
        }
    };

    const fetchPopularFilms = async (signal?: AbortSignal): Promise<Film[]> =>
    {
        const result = await filmService.getPopularFilms(signal);
        if (result.success)
        {
            return result.data.films;
        }
        else if (result.success === false)
        {
            console.error("Failed to fetch popular films");
        }

        return [];
    };

    const fetchUpcomingFilms = async (signal?: AbortSignal): Promise<Film[]> =>
    {
        const result = await filmService.getUpcomingFilms(signal);
        if (result.success)
        {
            return result.data.films;
        }
        else if (result.success === false)
        {
            console.error("Failed to fetch upcoming films");
        }

        return [];
    };

    const handleCurrentFilmClick = async (): Promise<void> =>
    {
        if (!currentFilm) return;

        setSelectedFilm(null);
        const targetUrl = `/films/${ encodeURIComponent(GenerateFilmSlug(currentFilm.title)) }/${ encodeURIComponent(String(currentFilm.tmdb_id)) }`;
        route(targetUrl);

        scrollToTop();
    };

    const filmLists = useMemo(() =>
    {
        return (
            <>
                <FilmGrid
                    title="Popular Films"
                    fetchFilms={fetchPopularFilms}
                />
                <FilmGrid
                    title="Upcoming Releases"
                    fetchFilms={fetchUpcomingFilms}
                />
            </>
        );
    }, [searchQuery]);

    return (
        <section id="homepage">
            {currentFilm && (currentFilm.youtube_key || currentFilm.backdrop_path) && (
                <BackgroundTrailer
                    className={`background-trailer selected-film-backdrop`}
                    youtubeKey={currentFilm.youtube_key ?? undefined}
                    backdropUrl={currentFilm.backdrop_path}
                    startAt={25}
                    duration={10}
                    privacyEnhanced={false}
                />
            )}

            <div id="homepage-header" class="container">
                <div className="current-film-container">
                    {currentFilm ? (
                        <>
                            <div id="current-film-title" className="fade-in">
                                <div>Currently showing:</div>
                                <div className="film-title" onClick={handleCurrentFilmClick}>
                                    {currentFilm.title}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="loading-placeholder-empty">
                        </div>
                    )}
                </div>
                <h1>CineSpin</h1>
                <h3>Can't decide what to watch? Have a spin!</h3>

                <div className="buttons">
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
                </div>
            </div>
            <div class="container" id="films">
                {filmLists}
            </div>
        </section>
    );
}