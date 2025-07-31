/** @jsxRuntime automatic */
/** @jsxImportSource preact */
import { render } from "preact";
import { FullscreenFilm } from "./components/FullscreenFilm";
import axios from "axios";
import { Film } from "../shared/models/Film";
import { FilmList } from "./components/FilmList";

async function getRandomFilm(): Promise<Film>
{
    const response = await axios.get(
        "http://localhost:3001/api/tmdb/random-film"
    );
    return (await response.data) as Film;
}

async function getRandomGoodFilm(): Promise<Film>
{
    const response = await axios.get(
        "http://localhost:3001/api/tmdb/random-good-film"
    );
    return (await response.data) as Film;
}

async function getRandomBadFilm(): Promise<Film>
{
    const response = await axios.get(
        "http://localhost:3001/api/tmdb/random-bad-film"
    );
    return (await response.data) as Film;
}

async function getPopularFilms(): Promise<Film[]>
{
    const response = await axios.get(
        "http://localhost:3001/api/tmdb/popular"
    );
    return (await response.data) as Film[];
}

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
            const film = await getRandomFilm();

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
            const film = await getRandomGoodFilm();

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
            const film = await getRandomBadFilm();
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

function populateHomepage()
{

}

document.addEventListener("DOMContentLoaded", () =>
{
    setupButtons();

    const target = document.getElementById("films");
    if (target)
    {
        render(
            <>
                <FilmList title="Popular Films" url="http://localhost:3001/api/tmdb/popular" fontawesome="fa-solid fa-fire" />
                <FilmList title="Upcoming Releases" url="http://localhost:3001/api/tmdb/upcoming" fontawesome="fa-solid fa-calendar-days" />
            </>,
            target
        )
    }
});
