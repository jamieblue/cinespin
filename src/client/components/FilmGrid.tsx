/** @jsxRuntime automatic */
/** @jsxImportSource preact */
import { useState, useEffect } from "preact/hooks";
import { Film } from "../../shared/models/films/Film";
import { FilmList } from "../../shared/models/lists/FilmList";
import { FilmTile } from "./FilmTile";

type Props = {
    title: string;
    fontawesome?: string;
    small?: boolean;
    currentList?: FilmList;
    onRemoveFilm?: (film: Film, list: FilmList) => void;
} & (
        | { films: Film[]; fetchFilms?: never; }
        | { films?: never; fetchFilms: () => Promise<Film[]>; }
    );

export function FilmGrid({ title, films: filmsProp, fetchFilms, fontawesome, small, currentList, onRemoveFilm }: Props)
{
    const [films, setFilms] = useState<Film[]>(filmsProp || []);
    const [loading, setLoading] = useState(false);

    useEffect(() =>
    {
        if (filmsProp)
        {
            setFilms(filmsProp);
        } else if (fetchFilms)
        {
            const loadFilms = async () =>
            {
                setLoading(true);
                try
                {
                    const fetchedFilms = await fetchFilms();
                    setFilms(fetchedFilms);
                } catch (error)
                {
                    console.error("Failed to fetch films:", error);
                } finally
                {
                    setLoading(false);
                }
            };

            loadFilms();
        }
    }, [filmsProp, fetchFilms]);

    return (
        <div className="film-list-container fade-in">
            <h2><i className={fontawesome}></i> {title}</h2>
            {loading ? (
                <div className="loading-placeholder pulsate"><span className="loader"></span></div>
            ) : (
                <div className={`film-list ${ small ? 'small' : '' }`}>
                    {films.map((film: Film) => (
                        <FilmTile
                            key={film.tmdb_id}
                            film={film}
                            small={small}
                            currentList={currentList}
                            onRemoveFilm={onRemoveFilm}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}