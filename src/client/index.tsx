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

function App()
{
    return (
        <>
            <AuthProvider>
                <ModalProvider>
                    <Navigation />
                    <div class="main">
                        <Router>
                            <Route path="/" component={Homepage} />
                            <Route path="/my-lists" component={ViewUserListsRoute} />
                        </Router>
                    </div>
                </ModalProvider>
            </AuthProvider>
        </>
    );
}

// Single render call
document.addEventListener("DOMContentLoaded", () =>
{
    render(
        <SelectedFilmProvider>
            <App />
        </SelectedFilmProvider>,
        document.body
    );
});