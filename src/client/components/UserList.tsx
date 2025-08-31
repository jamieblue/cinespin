/** @jsxRuntime automatic */
/** @jsxImportSource preact */
import { useState, useEffect } from "preact/hooks";
import { Film } from "../../shared/models/films/Film";
import { FilmList } from "../../shared/models/lists/FilmList";
import { listService } from "../../shared/services/listService";
import * as constants from "../../shared/constants/tmdb";
import { useModal } from "../contexts/ModalContext";
import { FilmGrid } from "./FilmGrid";
import { ModalSize } from "../../shared/models/modals/ModalSize";
import { ViewUserLists } from "./ViewUserLists";

type Props = {
    list?: FilmList;
    slug?: string;
};

export function UserList({ list, slug }: Props)
{
    const { showModal } = useModal();
    const [currentList, setCurrentList] = useState<FilmList | null>(list || null);

    useEffect(() =>
    {
        setCurrentList(list);
    }, []);

    useEffect(() =>
    {
        if (slug)
        {
            listService.getListBySlug(slug).then(result =>
            {
                if (result.success)
                {
                    setCurrentList(result.data.list);
                }
            });
        }
    }, [slug]);

    const handleBackToLists = () =>
    {
        showModal(<ViewUserLists />, 'My Lists', ModalSize.Large);
    };

    const handleRemoveFromList = async (film: Film, list: FilmList) =>
    {
        if (film && list)
        {
            const result = await listService.removeFilmFromList({ listId: list.id, filmId: film.id });
            if (result.success)
            {
                const listResult = await listService.getList({ listId: list.id });
                if (listResult.success)
                {
                    setCurrentList(listResult.data.list);
                }
            }
            else if (result.success === false)
            {
                console.error(`Failed to remove film from list: ${ list.name }`, result.error);
            }
        }
    };

    return (
        <div>
            <button onClick={handleBackToLists} className="back-to-lists-button">
                <i className="fas fa-arrow-left"></i> Back to Lists
            </button>
            <FilmGrid
                key={currentList?.id}
                films={currentList?.films}
                title={currentList?.name}
                small={true}
                currentList={currentList}
                onRemoveFilm={handleRemoveFromList}
            />
        </div>
    );
}