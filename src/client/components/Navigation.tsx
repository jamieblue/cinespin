/** @jsxRuntime automatic */
/** @jsxImportSource preact */
import { useEffect, useState } from "preact/hooks";
import { ModalSize } from "../../shared/models/modals/ModalSize";
import { useAuth } from "../contexts/AuthContext";
import { useModal } from "../contexts/ModalContext";
import { GoogleLogin } from "./GoogleLogin";
import { ViewUserLists } from "./ViewUserLists";
import { useSearch } from "../contexts/SearchContext";
import { getCurrentUrl, route } from "preact-router";

export function Navigation()
{
    const { user, logout } = useAuth();
    const { showModal } = useModal();
    const { searchQuery, setSearchQuery } = useSearch();
    const [isHomePage, setIsHomePage] = useState<boolean>(false);

    useEffect(() =>
    {
        const checkHomePage = () =>
        {
            setIsHomePage(window.location.pathname === "/");
        };

        // Check initially
        checkHomePage();

        // Listen for popstate events (back/forward button)
        window.addEventListener('popstate', checkHomePage);

        // Use MutationObserver to detect programmatic route changes
        const observer = new MutationObserver(checkHomePage);
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false
        });

        return () =>
        {
            window.removeEventListener('popstate', checkHomePage);
            observer.disconnect();
        };
    }, []);

    const handleLogout = async () =>
    {
        try { await logout(); }
        catch (error) { console.error('Logout failed:', error); }
    };

    const handleSearchInput = (e: Event) =>
    {
        const val = (e.target as HTMLInputElement).value;
        setSearchQuery(val);
    };

    const clearSearch = () => setSearchQuery('');

    const showLoginModal = () => showModal(<GoogleLogin />, 'Sign in');

    const handleViewLists = () =>
    {
        showModal(<ViewUserLists />, 'My Lists', ModalSize.Large);
    };

    const handleHomeClick = (e: Event) =>
    {
        e.preventDefault();
        e.stopPropagation();

        // Only navigate if we're not already on the homepage
        if (window.location.pathname !== '/')
        {
            route('/');
        }

        if (searchQuery)
        {
            setSearchQuery('');
        }
    };

    return (
        <>
            <nav id="navDesktop">
                <ul class="nav-left">
                    {!isHomePage && (
                        <li>
                            <a href="/" onClick={handleHomeClick} id="cineSpinLogo">
                                <h1><span>CineSpin</span></h1>
                            </a>
                        </li>
                    )}
                    <li class="search-input-wrapper">
                        <i class="fa fa-magnifying-glass"></i>
                        <input
                            class="search-bar"
                            id="movieSearch"
                            type="text"
                            placeholder="Search for a film"
                            value={searchQuery}
                            onInput={handleSearchInput}
                            autocomplete="off"
                        />
                        {searchQuery && (
                            <span class="clear-search" onClick={clearSearch} role="button" aria-label="Clear search">
                                &#10006;
                            </span>
                        )}
                    </li>
                </ul>

                <ul class="nav-right">
                    {user ? (
                        <>
                            <li>
                                <a href={`/lists/${user.name.toLowerCase().replace(/\s+/g, '-')}/${user.id}`}>
                                    <i class="fa-solid fa-list"></i> &nbsp; My Lists
                                </a>
                            </li>
                            <li>
                                <a href="#" onClick={handleViewLists}>
                                    <i class="fa-solid fa-filter"></i> &nbsp; Filters
                                </a>
                            </li>
                            <li>
                                <a href="#" onClick={handleLogout}>
                                    <i class="fa-solid fa-right-from-bracket"></i> &nbsp;Logout
                                </a>
                            </li>
                        </>
                    ) : (
                        <li>
                            <a href="#" onClick={showLoginModal}>
                                <i class="fa-solid fa-user"></i> &nbsp; Login
                            </a>
                        </li>
                    )}
                </ul>
            </nav>

            <nav id="navMobile">
                <ul>
                    <li class="nav-search">
                        <i class="fa fa-magnifying-glass"></i>
                    </li>
                    {user ? (
                        <>
                            <li>
                                <a href="#" onClick={handleViewLists}>
                                    <i class="fa-solid fa-list"></i>
                                </a>
                            </li>
                            <li>
                                <a href="#" onClick={handleViewLists}>
                                    <i class="fa-solid fa-filter"></i>
                                </a>
                            </li>
                            <li>
                                <a href="#" onClick={handleLogout}>
                                    <i class="fa-solid fa-right-from-bracket"></i>
                                </a>
                            </li>
                        </>
                    ) : (
                        <li>
                            <a href="#" onClick={showLoginModal}>
                                <i class="fa-solid fa-user"></i>
                            </a>
                        </li>
                    )}
                </ul>
            </nav>
        </>
    );
}