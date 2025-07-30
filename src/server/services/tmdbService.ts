import * as dotenv from "dotenv";
import axios from "axios";
import { Film } from "../../shared/models/Film";
import { getFilmRatingById } from "./imdbService";
import * as numberFormatter from "../../shared/util/numberFormatter";
import * as constants from "../../shared/constants/tmdb";
import { GetGenresByIDsQueryHandler } from "../cqrs/genres/queries/getGenresByIDsQuery";

dotenv.config();
const TMDB_API = constants.TMDB_API_URL;
const TMDB_TOKEN = process.env.TMDB_TOKEN;

const tmdbClient = axios.create({
    baseURL: TMDB_API,
    headers: {
        Authorization: `Bearer ${ TMDB_TOKEN }`,
        Accept: "application/json",
    },
});

export async function getRandomFilm(
    rating: number | null,
    voteCount: number | null,
    aboveThreshold: boolean | null
): Promise<Film>
{
    let voteAverageKey = "vote_average.gte";
    if (aboveThreshold != null && !aboveThreshold)
    {
        voteAverageKey = "vote_average.lte";
    }

    const baseParams = {
        [voteAverageKey]: rating ?? 5,
        "vote_count.gte": voteCount ?? 500,
        sort_by: "vote_average.desc",
        include_adult: false,
        include_video: false,
        page: 1,
    };

    const firstPage = await tmdbClient.get("/discover/movie", {
        params: baseParams,
    });

    const totalPages = Math.min(firstPage.data.total_pages, 500); // API caps at 500
    const randomPage = Math.floor(Math.random() * totalPages) + 1;

    const randomPageRes = await tmdbClient.get("/discover/movie", {
        params: { ...baseParams, page: randomPage },
    });

    const movies = randomPageRes.data.results;
    const randomMovie = movies[Math.floor(Math.random() * movies.length)];

    const imdbRating = await getFilmRatingById(await getImdbID(randomMovie.id));

    const getGenresResult = await new GetGenresByIDsQueryHandler().handle({
        genreIds: randomMovie.genre_ids,
    });

    return {
        id: randomMovie.id,
        title: randomMovie.title,
        overview: randomMovie.overview,
        poster_path: randomMovie.poster_path,
        release_date: new Date(randomMovie.release_date).getFullYear(),
        vote_count: numberFormatter.formatNumber(randomMovie.vote_count),
        vote_average: randomMovie.vote_average,
        imdb_rating: imdbRating.imdbRating,
        imdb_vote_count: imdbRating.imdbVoteCount,
        metacritic_rating: imdbRating.metacriticRating,
        metacritic_vote_count: imdbRating.metacriticVoteCount,
        genres: getGenresResult.success ? getGenresResult.data.genres : [],
    };
}

async function getImdbID(id: number): Promise<string>
{
    const response = await tmdbClient.get(`/movie/${ id }`);

    return response.data.imdb_id;
}
