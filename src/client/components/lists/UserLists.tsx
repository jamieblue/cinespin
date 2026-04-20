/** @jsxRuntime automatic */
/** @jsxImportSource preact */
import { useState, useEffect } from "preact/hooks";
import { FilmList } from "../../../shared/models/lists/FilmList";
import { UserListItem } from "./UserListItem";
import { useAuth } from "../../contexts/AuthContext";
import { CreateListForm } from "../CreateListForm";
import { Film } from "../../../shared/models/films/Film";
import { useModal } from "../../contexts/ModalContext";
import { ModalSize } from "../../../shared/models/modals/ModalSize";
import { useBodyClass } from "../../hooks/UseBodyClass";

export function UserLists(props: { listsProp: FilmList[], userName: string, listUserId: number })
{
    const { user } = useAuth();
    const { showModal } = useModal();
    const [lists, setLists] = useState<FilmList[]>(props.listsProp || []);
    const [filteredLists, setFilteredLists] = useState<FilmList[]>(props.listsProp || []);
    const [isCurrentUsersLists, setIsCurrentUsersLists] = useState<boolean>(false);
    const [listSearchQuery, setListSearchQuery] = useState<string>("");

    useBodyClass("gradient-background");

    useEffect(() =>
    {
        setIsCurrentUsersLists(user?.id === props.listUserId);
    }, [user, props.listUserId]);

    useEffect(() =>
    {
        setLists(props.listsProp || []);
        setFilteredLists(props.listsProp || []);
    }, [props.listsProp]);

    const handleSearchInput = (e: Event) =>
    {
        const val = (e.target as HTMLInputElement).value;

        if (!val)
        {
            setFilteredLists(lists);
            setListSearchQuery('');
            return;
        }

        setListSearchQuery(val);
        setFilteredLists(lists.filter(list => list.name.toLowerCase().includes(val.toLowerCase())));
    }

    const handleListClick = (listId: number) =>
    {
        
    }

    const handleCreateList = (film?: Film) =>
    {
        showModal(<CreateListForm filmProp={film} />, 'Create List', ModalSize.Medium);
    }

    return (
        <div className="lists-container">
            <h2>{isCurrentUsersLists ? 'My Lists' : `${ props.userName }'s Lists`}</h2>
            <div class="input-buttons">
                <div class="search-input-wrapper">
                    <i class="fa fa-magnifying-glass"></i>
                    <input
                        class="search-bar"
                        id="listsSearch"
                        type="text"
                        placeholder="Search your lists"
                        value={listSearchQuery}
                        autocomplete="off"
                        onInput={handleSearchInput}
                    />
                </div>
                <div class="lists-buttons">
                    <button type="button" id="random-list-button"><i className="fa-solid fa-rotate-right"></i> Random List</button>
                </div>
            </div>

            {filteredLists && filteredLists.length > 0 ? (
                <div className="lists fade-in">
                    {isCurrentUsersLists &&
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
                    }
                    {filteredLists.map((list) => (
                        <UserListItem key={list.id} list={list} />
                    ))}
                </div>
            ) : listSearchQuery && (
                <div className="no-results">
                    <p>No results found for "{listSearchQuery}"</p>
                </div>
            )}
        </div>
    );
}