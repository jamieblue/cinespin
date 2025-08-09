/** @jsxRuntime automatic */
/** @jsxImportSource preact */
import { useState, useEffect } from "preact/hooks";
import { Film } from "../../shared/models/films/Film";
import { FilmTile } from "./FilmTile";
import { render } from "preact";
import { FullscreenFilm } from "./FullscreenFilm";

type Props = {
    title: string;
    fetchFilms: () => Promise<Film[]>;
    fontawesome?: string;
};


export function FilmList({ title, fetchFilms, fontawesome }: Props)
{
    const [films, setFilms] = useState<Film[]>([]);
    const [loading, setLoading] = useState(false);

    function handleFilmClick(film: Film)
    {
        const target = document.getElementById("randomSelectedFilm");
        if (target)
        {
            render(
                <FullscreenFilm
                    film={film}
                    onClose={() => render(null, target)}
                />,
                target
            );
        }
    }

    useEffect(() =>
    {
        async function loadFilms()
        {
            setLoading(true);
            try
            {
                const films = await fetchFilms();
                setFilms(films);
            } catch (error)
            {
                console.error("Failed to fetch films:", error);
            } finally
            {
                setLoading(false);
            }
        }
        loadFilms();
    }, [fetchFilms]);

    return (
        <div className="film-list-container">
            <h2><i className={fontawesome}></i> {title}</h2>
            {loading ? (
                <div className="loading-placeholder pulsate"><span className="loader"></span></div>
            ) : (
                <div className="film-list">
                    {films.map((film: Film) => (
                        <FilmTile key={film.tmdb_id} film={film} onClick={() => handleFilmClick(film)} />
                    ))}
                </div>
            )}
        </div>
    );
}