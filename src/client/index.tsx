/** @jsxRuntime automatic */
/** @jsxImportSource preact */
import { render } from "preact";
import { FullscreenFilm } from "./components/FullscreenFilm";
import { FilmList } from "./components/FilmList";
import { Navigation } from "./components/Navigation";
import { filmService } from "../shared/util/filmService";

async function setupButtons()
{
    const goodFilmbutton = document.getElementById("randomGoodFilm");
    const badFilmbutton = document.getElementById("randomBadFilm");
    const randomFilmbutton = document.getElementById("randomFilm");
    const target = document.getElementById("randomSelectedFilm");

    if (randomFilmbutton && target)
    {
        randomFilmbutton.addEventListener("click", async () =>
        {
            const film = await filmService.getRandomFilm();

            render(
                <FullscreenFilm
                    film={film}
                    onClose={() => render(null, target)}
                />,
                target
            );
        });
    }

    if (goodFilmbutton && target)
    {
        goodFilmbutton.addEventListener("click", async () =>
        {
            const film = await filmService.getRandomGoodFilm();

            render(
                <FullscreenFilm
                    film={film}
                    onClose={() => render(null, target)}
                />,
                target
            );
        });
    }

    if (badFilmbutton && target)
    {
        badFilmbutton.addEventListener("click", async () =>
        {
            const film = await filmService.getRandomBadFilm();
            if (!film)
            {
                target.textContent = "Failed to load film.";
                return;
            }
            render(
                <FullscreenFilm
                    film={film}
                    onClose={() => render(null, target)}
                />,
                target
            );
        });
    }
}

function showHomepageFilms()
{
    const filmsContainer = document.getElementById("films");
    if (filmsContainer)
    {
        render(
            <>
                <FilmList title="Popular Films" fetchFilms={async () => await filmService.getPopularFilms()} fontawesome="fa-solid fa-fire" />
                <FilmList title="Upcoming Releases" fetchFilms={async () => await filmService.getUpcomingFilms()} fontawesome="fa-solid fa-calendar-days" />
            </>,
            filmsContainer
        );
    }
}

let searchTimeout: number | undefined;

document.addEventListener("DOMContentLoaded", () =>
{
    const navigation = document.getElementById("navigation");
    if (navigation)
    {
        render(<Navigation />, navigation);
    }
    setupButtons();
    showHomepageFilms();

    const searchInput = document.getElementById("movieSearch") as HTMLInputElement;
    if (searchInput)
    {
        searchInput.addEventListener("keyup", async (event) =>
        {
            if (searchTimeout) clearTimeout(searchTimeout);
            const query = searchInput.value.trim();

            if (!query || query === "")
            {
                showHomepageFilms();
                return;
            }

            searchTimeout = window.setTimeout(() =>
            {
                const filmsContainer = document.getElementById("films");
                if (filmsContainer)
                {
                    render(
                        <FilmList title={`Search Results for "${ query }"`} fetchFilms={async () => await filmService.searchFilms(encodeURIComponent(query))} fontawesome="fa-solid fa-magnifying-glass" />,
                        filmsContainer
                    );
                }
            }, 500);
        });
    }
});
