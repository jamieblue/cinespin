/** @jsxRuntime automatic */
/** @jsxImportSource preact */
import { ModalSize } from "../../shared/models/modals/ModalSize";
import { useAuth } from "../contexts/AuthContext";
import { useModal } from "../contexts/ModalContext";
import { CreateListForm } from "./CreateListForm";
import { GoogleLogin } from "./GoogleLogin";
import { ViewUserLists } from "./ViewUserLists";


export function Navigation()
{
    const { user, logout } = useAuth();
    const { showModal } = useModal();

    const handleLogout = async () =>
    {
        try
        {
            await logout();
        } catch (error)
        {
            console.error('Logout failed:', error);
        }
    };

    const showLoginModal = () =>
    {
        showModal(<GoogleLogin />, 'Sign in');
    };

    const handleViewLists = () =>
    {
        showModal(<ViewUserLists />, 'My Lists', ModalSize.Large);
    };

    const handleCreateList = () =>
    {
        showModal(<CreateListForm />, 'Create List', ModalSize.Medium);
    };

    return (
        <>
            <nav>
                {user ? (
                    <>
                        <button type="button" id="viewListsButton" onClick={handleViewLists}>
                            <i class="fa-solid fa-list"></i> &nbsp; My Lists
                        </button>
                        <button type="button" id="createListButton" onClick={handleCreateList}>
                            <i class="fa-solid fa-plus"></i> &nbsp; Create a List
                        </button>
                        <button type="button" id="logoutButton" onClick={handleLogout}>
                            <i class="fa-solid fa-right-from-bracket"></i> &nbsp;Logout
                        </button>
                    </>
                ) : (
                    <button type="button" id="loginButton" onClick={showLoginModal}>
                        <i class="fa-solid fa-user"></i> &nbsp; Login
                    </button>
                )}
            </nav>
        </>
    );
}