/** @jsxRuntime automatic */
/** @jsxImportSource preact */
import { useState, useCallback, useMemo, useEffect } from "preact/hooks";
import { FilmGrid } from "../components/FilmGrid";
import { FullscreenFilm } from "../components/FullscreenFilm";
import { filmService } from "../../shared/services/filmService";
import { Film } from "../../shared/models/films/Film";
import { RandomFilmType } from "../../shared/models/films/RandomFilmType";
import { useSelectedFilm } from "../contexts/SelectedFilmContext";

export function Homepage()
{
    const [selectedFilm, setSelectedFilm] = useSelectedFilm();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchTimeout, setSearchTimeout] = useState<number | undefined>();

    useEffect(() =>
    {

    }, [selectedFilm]);

    const handleRandomFilm = useCallback(async (type: RandomFilmType) =>
    {
        let film: Film;
        switch (type)
        {
            case RandomFilmType.Good:
                const result = await filmService.getRandomGoodFilm();
                if (result.success)
                {
                    film = result.data.film;
                }
                break;
            case RandomFilmType.Bad:
                const badResult = await filmService.getRandomBadFilm();
                if (badResult.success)
                {
                    film = badResult.data.film;
                }
                break;
            default:
                const defaultResult = await filmService.getRandomFilm();
                if (defaultResult.success)
                {
                    film = defaultResult.data.film;
                }
        }
        setSelectedFilm(film);
    }, []);

    const handleSearch = useCallback((query: string) =>
    {
        if (searchTimeout) clearTimeout(searchTimeout);

        const timeout = window.setTimeout(() =>
        {
            setSearchQuery(query);
        }, 250);

        setSearchTimeout(timeout);
    }, [searchTimeout]);

    const fetchPopularFilms = async (): Promise<Film[]> =>
    {
        const result = await filmService.getPopularFilms();
        if (result.success)
        {
            return result.data.films;
        }
        else if (result.success === false)
        {
            console.error("Failed to fetch popular films");
        }
    };

    const fetchUpcomingFilms = async (): Promise<Film[]> =>
    {
        const result = await filmService.getUpcomingFilms();
        if (result.success)
        {
            return result.data.films;
        }
        else if (result.success === false)
        {
            console.error("Failed to fetch upcoming films");
        }
    };

    const fetchSearchResults = async (query: string): Promise<Film[]> =>
    {
        const result = await filmService.searchFilms(query);
        if (result.success)
        {
            return result.data.films;
        }
        else if (result.success === false)
        {
            console.error("Failed to fetch search results");
        }
    };

    // Memoize the film lists to prevent re-render
    const filmLists = useMemo(() =>
    {
        if (searchQuery.trim())
        {
            return (
                <FilmGrid
                    title={`Search Results for "${ searchQuery }"`}
                    fetchFilms={() => fetchSearchResults(encodeURIComponent(searchQuery))}
                    fontawesome="fa-solid fa-magnifying-glass"
                />
            );
        }

        return (
            <>
                <FilmGrid
                    title="Popular Films"
                    fetchFilms={fetchPopularFilms}
                    fontawesome="fa-solid fa-fire"
                />
                <FilmGrid
                    title="Upcoming Releases"
                    fetchFilms={fetchUpcomingFilms}
                    fontawesome="fa-solid fa-calendar-days"
                />
            </>
        );
    }, [searchQuery]);

    const closeFullscreenFilm = useCallback(() =>
    {
        setSelectedFilm(null);
    }, []);

    return (
        <>
            {selectedFilm && (
                <div id="randomSelectedFilm">
                    <FullscreenFilm film={selectedFilm} onClose={closeFullscreenFilm} />
                </div>
            )}

            <div class="container" id="homeSplash">
                <h1><i class="fa-solid fa-film"></i> CineSpin</h1>
                <input
                    class="search-bar"
                    id="movieSearch"
                    type="text"
                    placeholder="Search for a movie"
                    onInput={(e) => handleSearch((e.target as HTMLInputElement).value)}
                />
            </div>

            <div class="container" id="spinButtons">
                <div class="container" id="spinButtons">
                    <button
                        type="button"
                        class="spin-button"
                        onClick={() => handleRandomFilm(RandomFilmType.Good)}
                    >
                        <i class="fa-solid fa-thumbs-up"></i>
                        <span>Random Good Film</span>
                    </button>
                    <button
                        type="button"
                        class="spin-button"
                        onClick={() => handleRandomFilm(RandomFilmType.Neutral)}
                    >
                        <i class="fa-solid fa-rotate"></i>
                        <span>Random Film</span>
                    </button>
                    <button
                        type="button"
                        class="spin-button"
                        onClick={() => handleRandomFilm(RandomFilmType.Bad)}
                    >
                        <i class="fa-solid fa-thumbs-down"></i>
                        <span>Random Bad Film</span>
                    </button>
                </div>
            </div>

            <div class="container" id="films">
                {filmLists}
            </div>
        </>
    );
}