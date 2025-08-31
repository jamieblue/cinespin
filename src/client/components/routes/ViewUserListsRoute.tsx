/** @jsxRuntime automatic */
/** @jsxImportSource preact */
import { useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { ModalSize } from '../../../shared/models/modals/ModalSize';
import { ViewUserLists } from '../ViewUserLists';
import { useModal } from '../../contexts/ModalContext';

export function ViewUserListsRoute()
{
    const { showModal } = useModal();

    useEffect(() =>
    {
        showModal(<ViewUserLists />, 'My Lists', ModalSize.Large, false, () => route('/'));
    }, []);

    return null;
}
