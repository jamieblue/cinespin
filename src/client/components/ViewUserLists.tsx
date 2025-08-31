/** @jsxRuntime automatic */
/** @jsxImportSource preact */
import { useState, useEffect } from "preact/hooks";
import { FilmList } from "../../shared/models/lists/FilmList";
import { listService } from "../../shared/services/listService";
import { UserListItem } from "./UserListItem";

export function ViewUserLists()
{
    const [lists, setLists] = useState<FilmList[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() =>
    {
        const fetchLists = async () =>
        {
            setLoading(true);
            const response = await listService.getMyLists();
            if (response.success)
            {
                setLists(response.data.lists);
            }
            else if (response.success === false)
            {
                console.error(response.error);
            }

            setLoading(false);
        };

        fetchLists();
    }, []);

    return (
        <div className="lists-container fade-in">
            {loading ? (
                <>
                    {Array.from({ length: 6 }).map((_, idx) => (
                        <div className="list-item loading-list-item" key={idx}>
                            <div className="films-preview empty">
                                <span className="loader"></span>
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div className="films-preview-item pulsate loading-preview" key={i}></div>
                                ))}
                            </div>
                            <div className="list-details loading-list-details">
                                <div className="list-name loading-bar pulsate"></div>
                                <div className="list-description loading-bar pulsate"></div>
                            </div>
                        </div>
                    ))}
                </>
            ) : (
                <>
                    <UserListItem />
                    {lists.map((list) => (
                        <UserListItem key={list.id} list={list} />
                    ))}
                </>
            )}
        </div>
    );
}