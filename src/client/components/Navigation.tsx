/** @jsxRuntime automatic */
/** @jsxImportSource preact */
import { useState, useEffect } from "preact/hooks";
import { render } from "preact";
import axios from "axios";
import { LoginModal } from "./LoginModal";
import { authService } from "../../shared/util/authService";

export function Navigation()
{
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() =>
    {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () =>
    {
        try
        {
            const user = await authService.getCurrentUser();
            setUser(user);
        } catch (error)
        {
            // Don't log 401 errors as they're expected when not authenticated
            if (axios.isAxiosError(error) && error.response?.status !== 401)
            {
                console.error('Auth check failed:', error);
            }
        } finally
        {
            setLoading(false);
        }
    };

    const handleLogout = async () =>
    {
        try
        {
            await authService.logout();
            setUser(null);
        } catch (error)
        {
            console.error('Logout failed:', error);
        }
    };

    const showLoginModal = () =>
    {
        const modalContainer = document.getElementById("modalContainer");
        if (!modalContainer)
        {
            const newModalContainer = document.createElement("div");
            newModalContainer.id = "modalContainer";
            document.body.appendChild(newModalContainer);
        }

        const container = document.getElementById("modalContainer");
        if (container)
        {
            render(
                <LoginModal onClose={hideLoginModal} />,
                container
            );
        }
    };

    const hideLoginModal = () =>
    {
        const modalContainer = document.getElementById("modalContainer");
        modalContainer?.remove();
    };

    return (
        <nav>
            {user ? (
                <>
                    <button type="button" id="createListButton"><i class="fa-solid fa-plus"></i> &nbsp; Create a List</button>
                    <button type="button" id="logoutButton" onClick={handleLogout}><i class="fa-solid fa-right-from-bracket"></i> &nbsp;Logout</button>
                </>
            ) : (
                <button type="button" id="loginButton" onClick={showLoginModal}><i class="fa-solid fa-plus"></i> &nbsp; Create a List</button>
            )}
        </nav>
    );
}