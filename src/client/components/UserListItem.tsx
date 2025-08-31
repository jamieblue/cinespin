/** @jsxRuntime automatic */
/** @jsxImportSource preact */
import { useEffect } from "preact/hooks";
import { FilmList } from "../../shared/models/lists/FilmList";
import * as constants from "../../shared/constants/tmdb";
import { useModal } from "../contexts/ModalContext";
import { getPrivacyInfo } from "../../shared/util/listHelper";
import { ModalSize } from "../../shared/models/modals/ModalSize";
import { CreateListForm } from "./CreateListForm";
import { Film } from "../../shared/models/films/Film";
import { listService } from "../../shared/services/listService";
import { UserList } from "./UserList";

const TMDB_IMAGE_BASE_URL = constants.TMDB_IMAGE_BASE_URL;
const TMDB_IMAGE_SIZES = constants.TMDB_IMAGE_SIZES;

type Props = {
    list?: FilmList;
    film?: Film;
};

export function UserListItem({ list, film }: Props)
{
    const { showModal } = useModal();

    useEffect(() =>
    {

    }, []);

    const handleListClick = async () =>
    {
        const result = await listService.getList({ listId: list.id });

        if (result.success)
        {
            showModal(<UserList list={result.data.list} />, 'View List', ModalSize.Large);
        }
        else if (result.success === false)
        {
            console.error('Failed to fetch list:', result.error);
        }
    };

    const handleCreateList = (film?: Film) =>
    {
        showModal(<CreateListForm filmProp={film} />, 'Create List', ModalSize.Medium);
    }

    const handleAddToListClick = async () =>
    {
        if (film)
        {
            const result = await listService.addFilmToList({ listId: list.id, film: film });
            if (result.success)
            {
                const listResult = await listService.getList({ listId: list.id });
                if (listResult.success)
                {
                    showModal(<UserList list={listResult.data.list} />, "View List", ModalSize.Large);
                }
            }
            else if (result.success === false)
            {
                console.error(`Failed to add film to list: ${ list.name }`, result.error);
            }
        }
    };

    if (!film && !list)
    {
        return (
            <div className="list-item" onClick={() => handleCreateList()}>
                <div className="films-preview empty">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="films-preview-item">

                        </div>
                    ))}
                </div>
                <div className="list-details">
                    <div className="list-name">
                        Create a new List
                    </div>
                    <div className="list-description">
                        Create a new list to add films to
                    </div>
                </div>
            </div>
        )
    }
    else if (film && !list)
    {
        return (
            <div className="list-item" onClick={() => handleCreateList(film)}>
                <div className="films-preview empty">
                    <div className="films-preview-item">
                        <i className="fas fa-circle-plus"></i>
                        <img
                            src={`${ TMDB_IMAGE_BASE_URL }/${ TMDB_IMAGE_SIZES["154"] }${ film.poster_path }`}
                            alt={film.title}
                        />
                    </div>
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="films-preview-item"></div>
                    ))}
                </div>
                <div className="list-details">
                    <div className="list-name">
                        Add to a new List
                    </div>
                    <div className="list-description">
                        Add this film to a new list
                    </div>
                </div>
            </div>
        )
    }
    else if (list)
    {
        return (
            <div key={list.id} className="list-item" onClick={film ? () => handleAddToListClick() : () => handleListClick()}>
                <div className={`films-preview ${ list.films.length < 4 ? 'empty' : '' }`}>
                    {list.films.slice(0, 4).map((listFilm) => (
                        <div className="films-preview-item" key={listFilm.id}>
                            <img
                                src={`${ TMDB_IMAGE_BASE_URL }/${ TMDB_IMAGE_SIZES["154"] }${ listFilm.poster_path }`}
                                alt={listFilm.title}
                            />
                        </div>
                    ))}

                    {Array.from({ length: Math.max(0, 4 - list.films.length) }).map((_, index) => (
                        <div key={`empty-${ index }`} className="films-preview-item"></div>
                    ))}
                </div>
                <div className="list-details">
                    <div className="list-name">{list.name}</div>
                    <div className="list-description">{list.description}</div>
                    <div className="list-privacy">
                        <i className={getPrivacyInfo(list.privacyType).icon}></i> {getPrivacyInfo(list.privacyType).label}
                    </div>
                </div>
            </div>
        );
    }
}