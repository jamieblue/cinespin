/** @jsxRuntime automatic */
/** @jsxImportSource preact */
import { render } from "preact";
import Router, { Route } from "preact-router";
import { AuthProvider } from "./contexts/AuthContext";
import { Navigation } from "./components/Navigation";
import { ModalProvider } from "./contexts/ModalContext";
import { SelectedFilmProvider } from "./contexts/SelectedFilmContext";
import { Homepage } from "./components/Homepage";
import { ViewUserListsRoute } from "./components/routes/ViewUserListsRoute";
import { ViewUserListRoute } from "./components/routes/ViewUserListRoute";
import { SearchProvider, useSearch } from "./contexts/SearchContext";
import { SelectedFilmDisplayRoute } from "./components/routes/SelectedFilmDisplayRoute";
import { SearchResults } from "./components/films/SearchResults";
import { FilmBottomSheetProvider } from "./contexts/FilmBottomSheetContext";
import { UserSettingsProvider } from "./contexts/UserSettingsContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function App()
{
    return (
        <AuthProvider>
            <QueryClientProvider client={new QueryClient()}>
                <UserSettingsProvider>
                    <FilmBottomSheetProvider>
                        <ModalProvider>
                            <SearchProvider>
                                <InnerApp />
                            </SearchProvider>
                        </ModalProvider>
                    </FilmBottomSheetProvider>
                </UserSettingsProvider>
            </QueryClientProvider>
        </AuthProvider>
    );
}

function InnerApp()
{
    const { searchQuery } = useSearch();

    return (
        <>
            <Navigation />

            <div class="main">
                {searchQuery.trim() ? (
                    <SearchResults />
                ) : (
                    <Router>
                        <Route path="/" component={Homepage} />
                        <Route path="/lists/:userName/:userId" component={ViewUserListsRoute} />
                        <Route path="/lists/:userName/:listId/:slug" component={ViewUserListRoute} />
                        <Route path="/films/:slug/:filmId" component={SelectedFilmDisplayRoute} />
                    </Router>
                )}
            </div>
        </>
    );
}

// Single render call
document.addEventListener("DOMContentLoaded", () =>
{
    render(<App />, document.getElementById("app")!);
});