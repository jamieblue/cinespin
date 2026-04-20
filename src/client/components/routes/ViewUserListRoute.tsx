/** @jsxRuntime automatic */
/** @jsxImportSource preact */
import { useEffect, useState } from 'preact/hooks';
import { listService } from '../../../shared/services/listService';
import { UserList } from '../lists/UserList';
import { FilmList } from 'shared/models/lists/FilmList';

export function ViewUserListRoute(props: { userName: string; listId: number; slug: string; })
{
    const [list, setList] = useState<FilmList | null>(null);

    useEffect(() =>
    {
        console.log("Fetching list...");
        const fetchList = async () =>
        {
            const response = await listService.getList({ listId: props.listId });
            if (response.success)
            {
                console.log('Full response:', response);
                console.log('List data:', response.data.list);
                console.log('User data:', response.data.list.user);
                setList(response.data.list);
            }
            else if (response.success === false)
            {
                console.error(response.error);
            }
        };

        fetchList();
    }, [props.listId]);

    if (!list)
    {
        return <div>Loading...</div>;
    }

    return <UserList list={list} />;
}
