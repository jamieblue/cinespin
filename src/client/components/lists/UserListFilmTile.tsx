/** @jsxRuntime automatic */
/** @jsxImportSource preact */
import { useEffect, useState } from "preact/hooks";
import { FilmList } from "../../../shared/models/lists/FilmList";
import * as constants from "../../../shared/constants/tmdb";
import { Film } from "../../../shared/models/films/Film";
import { GenerateFilmSlug } from "../../../shared/util/filmHelper";
import { useAuth } from "../../../client/contexts/AuthContext";

const TMDB_IMAGE_BASE_URL = constants.TMDB_IMAGE_BASE_URL;
const TMDB_IMAGE_SIZES = constants.TMDB_IMAGE_SIZES;

type Props = {
    list?: FilmList;
    film?: Film;
};

export function UserListFilmTile({ film }: Props)
{
    const { user } = useAuth();
    const [currentFilm, setCurrentFilm] = useState<Film>(film);

    useEffect(() =>
    {

    }, []);

    return (
        <div className="user-list-film-tile">
            <a href={`/films/${ encodeURIComponent(GenerateFilmSlug(film.title)) }/${ encodeURIComponent(String(film.tmdb_id)) }`}>
                <img src={`${TMDB_IMAGE_BASE_URL}/${TMDB_IMAGE_SIZES['200']}${currentFilm.poster_path}`} alt={currentFilm.title} />
            </a>
                {user && (
                    <div className="film-tile-actions">
                            <button className="film-tile-action">
                                <i className="fas fa-trash"></i>
                            </button>
                    </div>
                )}
        </div>
    );
}