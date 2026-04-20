/** @jsxRuntime automatic */
/** @jsxImportSource preact */
import { useState, useMemo, useEffect, useRef } from "preact/hooks";
import { FilmGrid } from "./FilmCarousel";
import { filmService } from "../../../shared/services/filmService";
import { Film } from "../../../shared/models/films/Film";
import { SelectedFilmDisplay } from "../films/SelectedFilmDisplay";
import { useSearch } from "../../contexts/SearchContext";
import { FilmGridLoadingPlaceholder } from "./FilmGridLoadingPlaceHolder";

export function SearchResults()
{
    const [selectedFilm, setSelectedFilm] = useState<Film | null>(null);
    const { searchQuery } = useSearch();
    const [searchResults, setSearchResults] = useState<Film[]>([]);
    const [loading, setLoading] = useState(false);
    const searchRequestIdRef = useRef(0);
    const debounceTimeoutRef = useRef<number | null>(null);

    // Debounced fetch only; searchQuery updates immediately elsewhere
    useEffect(() =>
    {
        const trimmed = searchQuery.trim();

        if (debounceTimeoutRef.current)
        {
            clearTimeout(debounceTimeoutRef.current);
            debounceTimeoutRef.current = null;
        }

        if (!trimmed)
        {
            setLoading(false);
            setSearchResults([]);
            setSelectedFilm(null);
            return;
        }

        setLoading(true);

        debounceTimeoutRef.current = window.setTimeout(async () =>
        {
            const requestId = ++searchRequestIdRef.current;
            try
            {
                const result = await filmService.searchFilms(trimmed);

                if (requestId !== searchRequestIdRef.current) return;

                if (result.success && result.data?.films?.length)
                {
                    const films = result.data.films;
                    console.log(`Search for "${ trimmed }" returned ${ films.length } results`);
                    if (!selectedFilm || !films.some(f => f.tmdb_id === selectedFilm.tmdb_id))
                        setSelectedFilm(films[0] || null);

                    setSearchResults(films.slice(1));
                }
                else
                {
                    setSearchResults([]);
                    setSelectedFilm(null);
                }
            }
            catch
            {
                if (requestId === searchRequestIdRef.current)
                {
                    setSearchResults([]);
                    setSelectedFilm(null);
                }
            }
            finally
            {
                if (requestId === searchRequestIdRef.current) setLoading(false);
            }
        }, 250);

        return () =>
        {
            if (debounceTimeoutRef.current)
            {
                clearTimeout(debounceTimeoutRef.current);
                debounceTimeoutRef.current = null;
            }
        };
    }, [searchQuery]);

    // Side-effects moved OUT of useMemo
    useEffect(() =>
    {
        if (!searchQuery.trim())
        {
            setSelectedFilm(null);
        }
    }, [searchQuery]);

    const filmLists = useMemo(() =>
    {
        const trimmed = searchQuery.trim();
        if (!trimmed) return null;

        if (loading)
        {
            setSelectedFilm(null);
            return (
                <FilmGridLoadingPlaceholder
                    title={`Search Results for  "${ trimmed }"`}
                    fontawesome="fa-solid fa-magnifying-glass"
                />
            );
        }

        if (!searchResults.length)
        {
            return (
                <FilmGrid
                    title={`No results for "${ trimmed }"`}
                    films={[]}
                    fontawesome="fa-solid fa-magnifying-glass"
                />
            );
        }

        return (
            <FilmGrid
                title={`Search Results for "${ trimmed }"`}
                films={searchResults}
                fontawesome="fa-solid fa-magnifying-glass"
            />
        );
    }, [searchQuery, searchResults, loading]);

    if (!searchQuery.trim()) return <></>;

    return (
        <>
            <div id="selectedFilm">
                <SelectedFilmDisplay showRecommendationsProp={false} selectedFilmProp={selectedFilm} />
            </div>
            <div class="container" id="films">
                {filmLists}
            </div>
        </>
    );
}