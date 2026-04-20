/** @jsxRuntime automatic */
/** @jsxImportSource preact */
import { useEffect, useState } from "preact/hooks";
import { FilmList } from "../../../shared/models/lists/FilmList";
import * as constants from "../../../shared/constants/tmdb";
import { Film } from "../../../shared/models/films/Film";
import { UserListFilmTile } from "./UserListFilmTile";

const TMDB_IMAGE_BASE_URL = constants.TMDB_IMAGE_BASE_URL;
const TMDB_IMAGE_SIZES = constants.TMDB_IMAGE_SIZES;

type Props = {
    list?: FilmList;
};

export function UserList({ list }: Props)
{
    const [currentList, setCurrentList] = useState<FilmList | null>(list || null);
    const [filmSearchQuery, setFilmSearchQuery] = useState<string>("");
    const [filteredFilms, setFilteredFilms] = useState<Film[]>(list?.films || []);

    useEffect(() =>
    {
        if (list)
        {
            setCurrentList(list);
            setFilteredFilms(list.films || []);
        }
    }, [list]);

    const handleSearchInput = (e: Event) =>
    {
        const val = (e.target as HTMLInputElement).value;

        if (!val)
        {
            setFilteredFilms(currentList?.films || []);
            setFilmSearchQuery('');
            return;
        }

        setFilmSearchQuery(val);
        setFilteredFilms(currentList?.films?.filter(film => film.title.toLowerCase().includes(val.toLowerCase())) || []);
    }

    if (!currentList)
    {
        return <div>Loading...</div>;
    }

    return (
        <div className="user-list-container">
            <h1>{currentList.name}</h1>
            {currentList.user && (
                <div className="user-info">
                    <i className="fa fa-user-circle"></i> <small>List by {currentList.user.name}</small>
                </div>
            )}
            <div class="input-buttons">
                <div class="search-input-wrapper">
                    <i class="fa fa-magnifying-glass"></i>
                    <input
                        class="search-bar"
                        id="listsSearch"
                        type="text"
                        placeholder="Search this list"
                        value={filmSearchQuery}
                        autocomplete="off"
                        onInput={handleSearchInput}
                    />
                </div>
                <div class="list-buttons">
                    <button type="button"><i className="fa-solid fa-rotate-right"></i> Random Film</button>
                </div>
            </div>
            {filteredFilms && filteredFilms.length > 0 ? (
                <div className="list-films fade-in">
                    {filteredFilms.map((film) => (
                        <UserListFilmTile key={film.id} film={film} />
                    ))}
                </div>
            ) : filmSearchQuery && (
                <div className="no-results">
                    <p>No results found for "{filmSearchQuery}"</p>
                </div>
            )}
        </div>
    );
}