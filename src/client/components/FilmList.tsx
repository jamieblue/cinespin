/** @jsxRuntime automatic */
/** @jsxImportSource preact */
import { useState, useEffect } from "preact/hooks";
import { Film } from "../../shared/models/Film";
import axios from "axios";
import { FilmTile } from "./FilmTile";
import { render } from "preact";
import { FullscreenFilm } from "./FullscreenFilm";

type Props = {
    title: string;
    url: string;
    fontawesome?: string;
};


export function FilmList({ title, url, fontawesome }: Props)
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
        async function fetchFilms()
        {
            setLoading(true);
            try
            {
                const response = await axios.get(url);
                setFilms(response.data as Film[]);
            } catch (error)
            {
                console.error("Failed to fetch films:", error);
            } finally
            {
                setLoading(false);
            }
        }
        fetchFilms();
    }, [url]);

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