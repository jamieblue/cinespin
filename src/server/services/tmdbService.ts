import * as dotenv from "dotenv";
import axios from "axios";
import { Film } from "../../shared/models/films/Film";
import * as imdbService from "./imdbService";
import * as numberFormatter from "../../shared/util/numberFormatter";
import * as constants from "../../shared/constants/tmdb";
import { GetGenresByIDsQueryHandler } from "../cqrs/genres/queries/getGenresByIDsQuery";
import { take, orderBy, chunk } from "lodash";
import Bottleneck from "bottleneck";

dotenv.config();
const TMDB_API = constants.TMDB_API_BASE_URL;
const TMDB_TOKEN = process.env.TMDB_TOKEN;

type TmdbFilm =
    {
        id: number;
        title: string;
        overview: string;
        poster_path: string;
        release_date: string;
        vote_count: number;
        vote_average: number;
        genre_ids: number[];
        imdb_id?: string;
    }

const tmdbClient = axios.create({
    baseURL: TMDB_API,
    headers: {
        Authorization: `Bearer ${ TMDB_TOKEN }`,
        Accept: "application/json",
    },
});

const tmdbLimiter = new Bottleneck({
    minTime: 20, // 1 request every 20ms (~50/sec)
});

const get = tmdbLimiter.wrap(
    tmdbClient.get.bind(tmdbClient)
) as typeof tmdbClient.get;

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

    const firstPage = await get("/discover/movie", { params: baseParams });

    const totalPages = Math.min(firstPage.data.total_pages, 500); // API caps at 500
    const randomPage = Math.floor(Math.random() * totalPages) + 1;

    const randomPageRes = await get("/discover/movie", {
        params: { ...baseParams, page: randomPage },
    });

    const movies: TmdbFilm[] = randomPageRes.data.results;
    const randomMovie: TmdbFilm = movies[Math.floor(Math.random() * movies.length)];

    const imdbID = await getImdbID(randomMovie.id)
    const imdbInfo = await imdbService.getFilmRatingById(imdbID);

    const getGenresResult = await new GetGenresByIDsQueryHandler().handle({
        genreIds: randomMovie.genre_ids,
    });

    return {
        tmdb_id: randomMovie.id,
        title: randomMovie.title,
        overview: randomMovie.overview,
        poster_path: randomMovie.poster_path,
        release_date: new Date(randomMovie.release_date).getFullYear(),
        vote_count: numberFormatter.formatNumber(randomMovie.vote_count),
        vote_average: randomMovie.vote_average,
        imdb_id: imdbID,
        imdb_rating: imdbInfo.imdbRating,
        imdb_vote_count: imdbInfo.imdbVoteCount,
        metacritic_url: imdbInfo.metacritic_url,
        metacritic_rating: imdbInfo.metacriticRating,
        metacritic_vote_count: imdbInfo.metacriticVoteCount,
        genres: getGenresResult.success ? getGenresResult.data.genres : [],
    };
}


export async function getPopularFilms(): Promise<Film[]>
{
    const baseParams = {
        sort_by: "vote_average.desc",
        include_adult: false,
        include_video: false,
        page: 1,
    };

    const firstPage = await get("/movie/popular", {
        params: baseParams,
    });

    const allFilms = take(orderBy(firstPage.data.results, ["popularity"], ["desc"]), 14);

    // 1. Map to IMDb batch request format
    const imdbRequests: imdbService.ImdbBatchFilmRequest[] = await Promise.all(
        allFilms.map(async (film: TmdbFilm): Promise<imdbService.ImdbBatchFilmRequest> => ({
            tmdbID: film.id,
            imdbID: await getImdbID(film.id),
        }))
    );

    // 2. Chunk IMDb requests into batches of 10
    const imdbChunks = chunk(imdbRequests, 10);

    // 3. Fetch all IMDb rating batches
    const allRatingsChunked = await Promise.all(
        imdbChunks.map((chunk) => imdbService.getFilmRatingsByIds(chunk))
    );

    // 4. Flatten the results into a single array
    const allImdbRatings: Partial<Film>[] = allRatingsChunked.flat();

    // 5. Build final Film array
    return await Promise.all(
        allFilms.map(async (film: TmdbFilm): Promise<Film> =>
        {
            const genreResult = await new GetGenresByIDsQueryHandler().handle({
                genreIds: film.genre_ids,
            });

            const imdbInfo = allImdbRatings.find((r) => r.tmdb_id === film.id);

            return {
                tmdb_id: film.id,
                title: film.title,
                overview: film.overview,
                poster_path: film.poster_path,
                release_date: new Date(film.release_date).getFullYear(),
                vote_count: numberFormatter.formatNumber(film.vote_count),
                vote_average: film.vote_average,
                imdb_id: imdbInfo?.imdb_id,
                imdb_rating: imdbInfo?.imdb_rating ?? 0,
                imdb_vote_count: imdbInfo?.imdb_vote_count ?? "0",
                metacritic_url: imdbInfo?.metacritic_url,
                metacritic_rating: imdbInfo?.metacritic_rating ?? 0,
                metacritic_vote_count: imdbInfo?.metacritic_vote_count ?? "0",
                genres: genreResult.success ? genreResult.data.genres : [],
            };
        })
    );
}

export async function getUpcomingFilms(): Promise<Film[]>
{
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

    const baseParams = {
        sort_by: "popularity.desc",
        include_adult: false,
        include_video: false,
        "primary_release_date.gte": today,
        page: 1,
    };

    const firstPage = await get("/discover/movie", {
        params: baseParams,
    });

    const allFilms: TmdbFilm[] = take(firstPage.data.results, 14);

    // Build final Film array
    return await Promise.all(
        allFilms.map(async (film: TmdbFilm): Promise<Film> =>
        {
            const genreResult = await new GetGenresByIDsQueryHandler().handle({
                genreIds: film.genre_ids,
            });

            return {
                tmdb_id: film.id,
                title: film.title,
                overview: film.overview,
                poster_path: film.poster_path,
                release_date: new Date(film.release_date).getFullYear(),
                vote_count: numberFormatter.formatNumber(film.vote_count),
                vote_average: film.vote_average,
                imdb_rating: 0,
                imdb_vote_count: "0",
                metacritic_rating: 0,
                metacritic_vote_count: "0",
                genres: genreResult.success ? genreResult.data.genres : [],
            };
        })
    );
}

export async function search(searchTerm: string): Promise<Film[]>
{
    const baseParams = {
        include_adult: false,
        page: 1,
        query: searchTerm,
    };

    const firstPage = await get("/search/movie", {
        params: baseParams,
    });

    const allFilms = take(firstPage.data.results, 14) as TmdbFilm[];

    const imdbRequests: imdbService.ImdbBatchFilmRequest[] = await Promise.all(
        allFilms.map(async (film: TmdbFilm): Promise<imdbService.ImdbBatchFilmRequest> => ({
            tmdbID: film.id,
            imdbID: await getImdbID(film.id),
        }))
    );

    // Chunk IMDb requests into batches of 10
    const imdbChunks = chunk(imdbRequests.filter((film) => !!film.imdbID), 10);

    // Fetch all IMDb rating batches
    const allRatingsChunked = await Promise.all(
        imdbChunks.map((chunk) => imdbService.getFilmRatingsByIds(chunk))
    );

    // Flatten the results into a single array
    const allImdbRatings: Partial<Film>[] = allRatingsChunked.flat();

    const films = await Promise.all(
        allFilms.filter((film: TmdbFilm) => !!film.poster_path)
            .map(async (film: TmdbFilm): Promise<Film> =>
            {
                const genreResult = await new GetGenresByIDsQueryHandler().handle({
                    genreIds: film.genre_ids,
                });

                const imdbInfo = allImdbRatings.find((r) => r.tmdb_id === film.id);

                return {
                    tmdb_id: film.id,
                    title: film.title,
                    overview: film.overview,
                    poster_path: film.poster_path,
                    release_date: new Date(film.release_date).getFullYear(),
                    vote_count: numberFormatter.formatNumber(film.vote_count),
                    vote_average: film.vote_average,
                    imdb_id: imdbInfo?.imdb_id,
                    imdb_rating: imdbInfo?.imdb_rating ?? 0,
                    imdb_vote_count: imdbInfo?.imdb_vote_count ?? "0",
                    metacritic_url: imdbInfo?.metacritic_url,
                    metacritic_rating: imdbInfo?.metacritic_rating ?? 0,
                    metacritic_vote_count: imdbInfo?.metacritic_vote_count ?? "0",
                    genres: genreResult.success ? genreResult.data.genres : [],
                };
            })
    );

    return orderBy(
        films,
        [film => Number(numberFormatter.parseFormattedNumber(film.imdb_vote_count))],
        ["desc"]
    );
}

async function getImdbID(id: number): Promise<string>
{
    const response = await get(`/movie/${ id }`);

    return response.data.imdb_id;
}
