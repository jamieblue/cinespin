/** @jsxRuntime automatic */
/** @jsxImportSource preact */
import { useEffect, useState } from 'preact/hooks';
import { UserLists } from '../lists/UserLists';
import { useAuth } from '../../contexts/AuthContext';
import { listService } from '../../../shared/services/listService';
import { FilmList } from '../../../shared/models/lists/FilmList';
import { capitalizeWords } from '../../../shared/util/textFormatter';

export function ViewUserListsRoute(props: { userId: number; userName: string; })
{
    const { user } = useAuth();
    const [lists, setLists] = useState<FilmList[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() =>
    {
        const userId = Number(props.userId);
        if (isNaN(userId))
        {
            return null;
        }

        const fetchLists = async () =>
        {
            const response = await listService.getListsForUser(props.userId, user?.id);
            console.log(response);
            if (response.success)
            {
                setLists(response.data.lists);
                setLoading(false);
            }
            else if (response.success === false)
            {
                console.error(response.error);
            }
        };

        fetchLists();
    }, [user?.id, props.userId]);

    return <UserLists listUserId={Number(props.userId)} listsProp={lists} userName={capitalizeWords(props.userName.replace(/-/g, " "))} />;
}
